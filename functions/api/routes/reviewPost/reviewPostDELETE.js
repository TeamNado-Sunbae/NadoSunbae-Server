const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewPostDB, relationReviewPostTagDB } = require("../../../db");

module.exports = async (req, res) => {
  const { postId } = req.params;

  // params 값이 없을 경우
  if (!postId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);

    // 로그인 한 유저가 reviewPost의 작성자가 아니면 403 error
    const reviewPost = await reviewPostDB.getReviewPostByPostId(client, postId);

    if (reviewPost.writerId !== req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
    }

    // reviewPost 삭제
    let deletedReviewPost = await reviewPostDB.deleteReviewPost(client, postId);

    if (!deletedReviewPost) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    // 삭제된 reviewPost와 연계된 relationReviewPostTag 삭제
    let deletedRelationReviewPostTag = await relationReviewPostTagDB.deleteRelationReviewPostTag(
      client,
      postId,
    );
    if (!deletedRelationReviewPostTag) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_RELATION));
    }

    // response로 보낼 isDeleted
    const isDeleted = deletedReviewPost.isDeleted;

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.DELETE_ONE_POST_SUCCESS, { postId, isDeleted }),
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
