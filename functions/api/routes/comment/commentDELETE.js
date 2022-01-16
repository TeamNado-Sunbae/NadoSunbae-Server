const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { commentDB } = require("../../../db");

module.exports = async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    const comment = await commentDB.getCommentByCommentId(client, commentId);
    if (!comment) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_COMMENT));
    }

    if (comment.writerId !== req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.FORBIDDEN_ACCESS));
    }

    let deletedComment = await commentDB.deleteCommentByCommentId(client, commentId);

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.DELETE_ONE_COMMENT_SUCCESS, deletedComment),
      );
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
