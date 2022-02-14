const functions = require("firebase-functions");
const admin = require("firebase-admin");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB } = require("../../../db");
const { firebaseAuth } = require("../../../config/firebaseClient");
const { sendEmailVerification, signInWithEmailAndPassword } = require("firebase/auth");

module.exports = async (req, res) => {
  const {
    email,
    nickname,
    password,
    universityId,
    firstMajorId,
    firstMajorStart,
    secondMajorId,
    secondMajorStart,
  } = req.body;

  if (
    !email ||
    !nickname ||
    !password ||
    !universityId ||
    !firstMajorId ||
    !firstMajorStart ||
    !secondMajorId ||
    !secondMajorStart
  ) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect();

    // Firebase Authentication을 통해 유저 생성
    const userFirebase = await admin
      .auth()
      .createUser({ email, password, nickname })
      .then((user) => user)
      .catch((e) => {
        console.log(e);
        return { err: true, error: e };
      });

    // 에러 검증
    if (userFirebase.err) {
      if (userFirebase.error.code === "auth/email-already-exists") {
        return res
          .status(statusCode.CONFLICT)
          .json(util.fail(statusCode.CONFLICT, "이미 가입된 메일입니다."));
      } else if (userFirebase.error.code === "auth/invalid-password") {
        return res
          .status(statusCode.BAD_REQUEST)
          .json(
            util.fail(
              statusCode.BAD_REQUEST,
              "비밀번호 형식이 잘못되었습니다. 패스워드는 최소 6자리의 문자열이어야 합니다.",
            ),
          );
      } else {
        return res
          .status(statusCode.INTERNAL_SERVER_ERROR)
          .json(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
      }
    }

    // RDS DB에 유저 생성
    const firebaseId = userFirebase.uid;

    // 유저 프로필 이미지 난수 생성
    const profileImageId = Math.floor(Math.random() * 5) + 1;

    let user = await userDB.createUser(
      client,
      email,
      nickname,
      profileImageId,
      universityId,
      firstMajorId,
      firstMajorStart,
      secondMajorId,
      secondMajorStart,
      firebaseId,
    );

    user = {
      userId: user.id,
      createdAt: user.createdAt,
    };

    // 로그인 및 메일 전송
    await signInWithEmailAndPassword(firebaseAuth, email, password)
      .then(() => sendEmailVerification(firebaseAuth.currentUser))
      .catch((e) => {
        return res
          .status(statusCode.INTERNAL_SERVER_ERROR)
          .send(
            util.fail(
              statusCode.INTERNAL_SERVER_ERROR,
              responseMessage.SEND_VERIFICATION_EMAIL_FAIL,
            ),
          );
      });

    res.status(statusCode.OK).send(
      util.success(
        statusCode.OK,
        `${responseMessage.CREATE_USER} 및 ${responseMessage.SEND_VERIFICATION_EMAIL_SUCCESS}`,
        {
          user,
        },
      ),
    );
  } catch (error) {
    console.log(error);
    functions.logger.error(
      `[EMAIL SIGNUP ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] email:${email} ${error}`,
    );

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
