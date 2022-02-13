const functions = require("firebase-functions");
const jwtHandlers = require("../../../lib/jwtHandlers");
const db = require("../../../db/db");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const { userDB } = require("../../../db");
const { TOKEN_INVALID, TOKEN_EXPIRED } = require("../../../constants/jwt");

module.exports = async (req, res) => {
  const { accessToken, refreshToken } = req.headers;

  // accessToken 또는 refreshToken이 없을 시
  if (!accessToken || !refreshToken)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.TOKEN_EMPTY));

  let client;
  try {
    client = await db.connect(req);

    // token 해독
    let decodedaccessToken = jwtHandlers.verify(accessToken);
    let decodedrefreshToken = jwtHandlers.verify(refreshToken);

    // 올바르지 않는 액세스 토큰 (만료와 상관없음)
    if (decodedaccessToken === TOKEN_INVALID || decodedrefreshToken == TOKEN_EXPIRED) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_INVALID));
    }

    // 토큰 만료 확인 및 재발급
    // refresh token 만료 (재로그인 필요)
    if (decodedrefreshToken === TOKEN_EXPIRED) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_EXPIRED));
    }

    // access token만 만료
    if (decodedaccessToken === TOKEN_EXPIRED) {
      const userData = await userDB.getUserByrefreshToken(client, refreshToken);
      if (userData.id) {
        // acesstoken 재발급
        const { accessToken } = jwtHandlers.access(userData);
        return res.status(statusCode.OK).send(
          util.success(statusCode.OK, responseMessage.UPDATE_TOKEN_SUCCESS, {
            accessToken: accessToken,
          }),
        );
      }
    }

    // 둘 다 유효한 토큰인 경우
    res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.ALREADY_UPDATED_TOKEN_SUCCESS));
  } catch (error) {
    console.log(error);
    functions.logger.error(
      `[AUTH ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      accessToken,
    );
    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
