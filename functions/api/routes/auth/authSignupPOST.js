const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, majorDB, universityDB } = require("../../../db");
const admin = require("firebase-admin");
const { firebaseAuth } = require("../../../config/firebaseClient");
const { sendEmailVerification, signInWithEmailAndPassword } = require("firebase/auth");
const slackAPI = require("../../../middlewares/slackAPI");
const errorHandlers = require("../../../lib/errorHandlers");

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

    res.status(statusCode.CREATED).send(
      util.success(
        statusCode.CREATED,
        `${responseMessage.CREATE_USER} 및 ${responseMessage.SEND_VERIFICATION_EMAIL_SUCCESS}`,
        {
          user,
        },
      ),
    );

    // 로그인 및 메일 전송
    await signInWithEmailAndPassword(firebaseAuth, email, password).then(() =>
      sendEmailVerification(firebaseAuth.currentUser),
    );

    // 슬랙에 유저 정보 전송
    const [university, firstMajor, secondMajor] = await Promise.all([
      universityDB.getNameByUniversityId(client, universityId),
      majorDB.getMajorByMajorId(client, firstMajorId),
      majorDB.getMajorByMajorId(client, secondMajorId),
    ]);

    const slackMessage = `[NEW USER]\nId: ${user.userId}\n닉네임: ${nickname}\n학교: ${university.universityName}
    \n본전공: ${firstMajor.majorName} ${firstMajorStart}\n제2전공: ${secondMajor.majorName} ${secondMajorStart} `;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_USER_MONITORING);
  } catch (error) {
    errorHandlers.error(req, error, `email: ${email}`);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
