const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { likeDB } = require("../../../db");
const { likeType } = require("../../../constants/type");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { targetId, type } = req.body;
  let user = req.user;

  if (!targetId || !type) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let targetTypeId;
    if (type === "review") {
      targetTypeId = likeType.REVIEW;
    } else if (type === "post") {
      targetTypeId = likeType.POST;
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_TYPE));
    }

    const likeData = await likeDB.getLikeByTarget(client, targetId, targetTypeId, user.id);
    let postLike;
    if (!likeData) {
      postLike = await likeDB.createLikeByTarget(client, targetId, targetTypeId, user.id);
    } else {
      postLike = await likeDB.updateLikeByTarget(client, targetId, targetTypeId, user.id);
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.UPDATE_LIKE_SUCCESS, postLike));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
