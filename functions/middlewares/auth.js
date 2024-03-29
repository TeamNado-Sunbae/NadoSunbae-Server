const functions = require("firebase-functions");
const jwtHandlers = require("../lib/jwtHandlers");
const db = require("../db/db");
const util = require("../lib/util");
const statusCode = require("../constants/statusCode");
const responseMessage = require("../constants/responseMessage");
const { userDB, inappropriateReviewDB } = require("../db");
const { TOKEN_INVALID, TOKEN_EXPIRED } = require("../constants/jwt");

const checkUser = async (req, res, next) => {
  const { accesstoken } = req.headers;
  if (!accesstoken)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.TOKEN_EMPTY));

  let client;
  try {
    client = await db.connect(req);

    // decode jwt
    const decodedToken = jwtHandlers.verify(accesstoken);

    // if decoded jwt expired or invalid
    if (decodedToken === TOKEN_EXPIRED)
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_EXPIRED));
    if (decodedToken === TOKEN_INVALID)
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_INVALID));

    // decoded jwt id is user id
    const userId = decodedToken.id;
    if (!userId)
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_INVALID));

    const user = await userDB.getUserByUserId(client, userId);
    if (!user)
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_USER));

    // put user object in req.user, send it to the next middleware
    // next middleware can use user object
    req.user = user;

    // verify if user has inappropriate review
    const inappropriateReview = await inappropriateReviewDB.getInappropriateReviewByUser(
      client,
      req.user.id,
    );
    user.isReviewInappropriate = inappropriateReview ? true : false;

    next();
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

module.exports = { checkUser };
