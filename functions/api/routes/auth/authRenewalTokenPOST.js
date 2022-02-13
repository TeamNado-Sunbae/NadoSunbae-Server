const functions = require("firebase-functions");
const jwtHandlers = require("../../../lib/jwtHandlers");
const db = require("../../../db/db");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const { userDB } = require("../../../db");
const { TOKEN_INVALID, TOKEN_EXPIRED } = require("../../../constants/jwt");

module.exports = async (req, res) => {
  const { accesstoken, refreshtoken } = req.headers;

  // accesstoken 또는 refreshtoken 없을 시
  if (!accesstoken || !refreshtoken)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.TOKEN_EMPTY));

  let client;
  try {
    client = await db.connect(req);

    // token 해독
    let decodedAccesstoken = jwtHandlers.verify(accesstoken);
    let decodedRefreshtoken = jwtHandlers.verify(refreshtoken);

    // 올바르지 않는 액세스 토큰 (만료와 상관없음)
    if (decodedAccesstoken === TOKEN_INVALID || decodedRefreshtoken == TOKEN_INVALID) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_INVALID));
    }

    // 토큰 만료 확인 및 재발급
    // refresh token 만료 (재로그인 필요)
    if (decodedRefreshtoken === TOKEN_EXPIRED) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_EXPIRED));
    }

    // 둘 다 유효한 토큰인 경우
    if (decodedAccesstoken !== TOKEN_EXPIRED) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.ALREADY_UPDATED_TOKEN_SUCCESS));
    }

    // access token만 만료
    const userData = await userDB.getUserByRefreshToken(client, refreshtoken);
    if (userData.id) {
      // acesstoken 재발급
      const { accesstoken } = jwtHandlers.access(userData);
      return res.status(statusCode.OK).send(
        util.success(statusCode.OK, responseMessage.UPDATE_TOKEN_SUCCESS, {
          accesstoken: accesstoken,
        }),
      );
    }
  } catch (error) {
    console.log(error);
    functions.logger.error(
      `[AUTH ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      accesstoken,
    );
    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
