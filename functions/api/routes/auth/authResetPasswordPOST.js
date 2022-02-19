const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB } = require("../../../db");
const { firebaseAuth } = require("../../../config/firebaseClient");
const { sendPasswordResetEmail } = require("firebase/auth");
const { slackAPI } = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 해당 이메일로 가입된 사용자가 있는지 확인
    const user = await userDB.getUserByEmail(client, email);
    if (!user) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_USER_EMAIL));
    }

    // 비밀번호 재설정 메일 전송
    await sendPasswordResetEmail(firebaseAuth, email)
      .then((user) => user)
      .catch((error) => {
        console.log(error.code, error.message);
        return res
          .status(statusCode.INTERNAL_SERVER_ERROR)
          .send(
            util.fail(
              statusCode.INTERNAL_SERVER_ERROR,
              responseMessage.SEND_RESET_PASSWORD_EMAIL_FAIL,
            ),
          );
      });

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.SEND_RESET_PASSWORD_EMAIL_SUCCESS, email));
  } catch (error) {
    console.log(error);
    functions.logger.error(
      `[EMAIL SIGNUP ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] email:${email} ${error}`,
    );

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${
      req.originalUrl
    } ${error} ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
