const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  let client;
  try {
    client = await db.connect(req);

    // 리프레시 토큰, 디바이스 토큰 업데이트
    const tokensUpdated = await userDB.updateUserByLogout(client, req.user.id);
    if (!tokensUpdated) {
      return res
        .status(statusCode.INTERNAL_SERVER_ERROR)
        .send(
          util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.UPDATE_REFRESH_TOKEN_FAIL),
        );
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.LOGOUT_SUCCESS));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
