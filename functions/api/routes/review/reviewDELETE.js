const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewDB, relationReviewTagDB, userDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);

    const review = await reviewDB.getReviewById(client, id);
    if (!review) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    // 로그인 한 유저가 review의 작성자가 아니면 403 error
    if (review.writerId !== req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
    }

    // review 삭제
    let deletedReview = await reviewDB.deleteReview(client, id);

    // 삭제된 review와 연계된 relationReviewTag 삭제
    let deletedRelationReviewTag = await relationReviewTagDB.deleteRelationReviewTag(client, id);
    if (!deletedRelationReviewTag) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST_TAG_RELATION));
    }

    // 후기글을 삭제 후, 해당 user가 작성한 다른 후기글이 없다면 isReviewed false로
    const reviewByUser = await reviewDB.getReviewListByUserId(client, req.user.id);
    let isReviewed = true;
    if (reviewByUser.length === 0) {
      const updatedUser = await userDB.updateUserByIsReviewed(client, false, req.user.id);
      isReviewed = updatedUser.isReviewed;
      if (!updatedUser) {
        return res
          .status(statusCode.NOT_FOUND)
          .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
      }
    }

    // deletedReview에 isReviewed 추가해서 response 보냄
    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.DELETE_ONE_POST_SUCCESS, {
        id: deletedReview.id,
        isDeleted: deletedReview.isDeleted,
        isReviewed: isReviewed,
      }),
    );
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
