const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, commentDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { postId } = req.params;

  if (!postId)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    let post = await postDB.getPostByPostId(client, postId);

    if (!post) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }
    // 1:1 질문글의 답변자가 아닌 경우 본인 게시글이 아닌데 삭제시도하면 403 FORBIDDEN Error
    if (post.answererId !== req.user.id && post.writerId !== req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
    }

    // 게시글 삭제
    let deletedPost = await postDB.deletePostByPostId(client, postId);

    // 관련된 댓글 삭제
    const deletedComment = await commentDB.deleteCommentListByPostId(client, postId);

    if (!deletedComment) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_COMMENT));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.DELETE_ONE_POST_SUCCESS, deletedPost));
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
