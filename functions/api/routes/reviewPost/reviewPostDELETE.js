const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewPostDB, relationReviewPostTagDB, userDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

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
    if (!reviewPost) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

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

    // 후기글을 삭제 후, 해당 user가 작성한 다른 후기글이 없다면 isReviewed false로
    const reviewPostByUser = await reviewPostDB.getReviewPostByUserId(client, req.user.id);
    let isReviewed = true;
    if (reviewPostByUser.length === 0) {
      const updatedUser = await userDB.updateUserByIsReviewed(client, false, req.user.id);
      isReviewed = updatedUser.isReviewed;
      if (!updatedUser) {
        return res
          .status(statusCode.NOT_FOUND)
          .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
      }
    }

    // deletedReviewPost에 isReviewed 추가해서 response 보냄
    deletedReviewPost.isReviewed = isReviewed;

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.DELETE_ONE_POST_SUCCESS, deletedReviewPost),
      );
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
