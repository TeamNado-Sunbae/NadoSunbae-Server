const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const { firebaseAuth } = require("../../../config/firebaseClient");
const { signInWithEmailAndPassword, sendEmailVerification } = require("firebase/auth");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  try {
    // 로그인 및 메일 전송
    const sentEmail = await signInWithEmailAndPassword(firebaseAuth, email, password)
      .then(() => {
        sendEmailVerification(firebaseAuth.currentUser);
        return { err: false };
      })
      .catch((e) => {
        console.log(e);
        return { err: true, error: e };
      });

    if (sentEmail.err) {
      return res
        .status(statusCode.INTERNAL_SERVER_ERROR)
        .send(
          util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.SEND_VERIFICATION_EMAIL_FAIL),
        );
    }

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.SEND_VERIFICATION_EMAIL_SUCCESS, { email }),
      );
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};
