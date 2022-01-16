const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { likeDB } = require("../../../db");

module.exports = async (req, res) => {
  const { postId, postTypeId } = req.body;
  let user = req.user;

  if (!postId || !postTypeId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let postLike;
    if (postTypeId === 0 || postTypeId >= 5) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
    }

    const likeData = await likeDB.getLikeByPostId(client, postId, postTypeId, user.id);
    if (!likeData) {
      postLike = await likeDB.createLikeByPostId(client, postId, postTypeId, user.id);
    } else {
      postLike = await likeDB.updateLikeByPostId(client, postId, postTypeId, user.id);
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

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
