const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { firebaseAuth } = require("../../../config/firebaseClient");
const { signInWithEmailAndPassword, sendEmailVerification } = require("firebase/auth");

module.exports = async (req, res) => {
  const { email, password } = req.body;

  let client;

  try {
    client = await db.connect(req);

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

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.SEND_VERIFICATION_EMAIL_SUCCESS, { email }),
      );
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
