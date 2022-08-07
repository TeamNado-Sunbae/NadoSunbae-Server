const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { likeDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const { likeType } = require("../../../constants/type");

module.exports = async (req, res) => {
  const { postId, type } = req.body;
  let user = req.user;

  if (!postId || !type) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let likeTypeId;
    if (type === "review") {
      likeTypeId = likeType.REVIEW;
    } else if (type === "post") {
      likeTypeId = likeType.POST;
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_TYPE));
    }

    const likeData = await likeDB.getLikeByPostId(client, postId, likeTypeId, user.id);
    let postLike;
    if (!likeData) {
      postLike = await likeDB.createLikeByPostId(client, postId, likeTypeId, user.id);
    } else {
      postLike = await likeDB.updateLikeByPostId(client, postId, likeTypeId, user.id);
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.UPDATE_LIKE_SUCCESS, postLike));
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

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
