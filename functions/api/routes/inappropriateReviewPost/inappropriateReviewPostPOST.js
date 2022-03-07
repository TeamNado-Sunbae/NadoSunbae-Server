const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const {
  inappropriateReviewPostDB,
  reviewPostDB,
  userDB,
  relationReviewPostTagDB,
} = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { postId, reason } = req.body;

  if (!postId || !reason) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // admin으로 사용할 계정의 nickname
    const adminNickname = "nadosunbae_admin";

    const adminUser = await userDB.getUserByNickname(client, adminNickname);

    // admin 외의 계정으로 접근할 시 에러 반환
    if (req.user.id !== adminUser.id) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.FORBIDDEN_ACCESS));
    }

    // 부적절 후기글 삭제
    const deletedInappropriateReviewPost = await reviewPostDB.deleteReviewPost(client, postId);

    // 부적절 후기글이 이미 삭제된 경우
    if (!deletedInappropriateReviewPost) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    // 삭제된 reviewPost와 연계된 relationReviewPostTag 삭제
    let deletedRelationReviewPostTag = await relationReviewPostTagDB.deleteRelationReviewPostTag(
      client,
      postId,
    );

    // 부적절 후기글을 삭제 후, 작성자의 isReviewed false로
    const updatedUser = await userDB.updateUserByIsReviewed(
      client,
      false,
      deletedInappropriateReviewPost.writerId,
    );
    if (!updatedUser) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
    }

    // 부적절 후기글 테이블에 추가
    const inappropriateReviewPost = await inappropriateReviewPostDB.createInappropriateReviewPost(
      client,
      postId,
      updatedUser.id,
      reason,
    );

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.CREATE_ONE_INAPPROPRIATE_REVIEW_POST_SUCCESS, {
        inappropriateReviewPost,
        deletedInappropriateReviewPost: deletedInappropriateReviewPost.id,
        isDeleted: deletedInappropriateReviewPost.isDeleted,
        isReviewed: updatedUser.isReviewed,
      }),
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
