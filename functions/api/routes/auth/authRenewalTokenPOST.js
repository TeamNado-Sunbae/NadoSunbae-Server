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

  // accesstoken 또는 refreshtoken이 없을 시
  if (!accesstoken || !refreshtoken)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.TOKEN_EMPTY));

  let client;
  try {
    client = await db.connect(req);

    // token 해독
    let decodedAccessToken = jwtHandlers.verify(accesstoken);
    let decodedRefreshToken = jwtHandlers.verify(refreshtoken);

    // 토큰 만료 확인 및 재발급
    if (decodedAccessToken === TOKEN_EXPIRED) {
      // access, refresh token 둘 다 만료 (재로그인 필요)
      if (decodedRefreshToken === TOKEN_EXPIRED) {
        return res
          .status(statusCode.UNAUTHORIZED)
          .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_EXPIRED));
      }
      // access token만 만료
      const userData = await userDB.getUserByRefreshToken(client, refreshtoken);
      if (userData.id) {
        // acesstoken 재발급
        const { accesstoken } = jwtHandlers.sign(userData);
        return res.status(statusCode.OK).send(
          util.success(statusCode.OK, responseMessage.UPDATE_TOKEN_SUCCESS, {
            accesstoken: accesstoken,
            refreshtoken: refreshtoken,
          }),
        );
      }
    } else if (decodedAccessToken === TOKEN_INVALID) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_INVALID));
    }
    // refreshtoken만 만료된 경우
    if (decodedRefreshToken === TOKEN_EXPIRED) {
      // refreshtoken 재발급 및 db에 저장
      const { refreshtoken } = jwtHandlers.refresh();
      const updatedUserByRefreshToken = await userDB.updateUserByRefreshToken(
        client,
        decodedAccessToken.id,
        refreshtoken,
      );
      if (!updatedUserByRefreshToken) {
        return res
          .status(statusCode.INTERNAL_SERVER_ERROR)
          .send(
            util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.UPDATE_DEVICE_TOKEN_FAIL),
          );
      }
      return res.status(statusCode.OK).send(
        util.success(statusCode.OK, responseMessage.UPDATE_TOKEN_SUCCESS, {
          accesstoken: accesstoken,
          refreshtoken: refreshtoken,
        }),
      );
    }
    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.ALREADY_UPDATED_TOKEN_SUCCESS, {
        accesstoken: accesstoken,
        refreshtoken: refreshtoken,
      }),
    );
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
