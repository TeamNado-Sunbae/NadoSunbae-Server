const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewDB, relationReviewTagDB, blockDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const postType = require("../../../constants/postType");

module.exports = async (req, res) => {
  const { universityId } = req.params;

  if (!universityId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    const [invisibleUserList, relationReviewTagList] = await Promise.all([
      blockDB.getInvisibleUserListByUserId(client, req.user.id),
      relationReviewTagDB.getRelationReviewTagList(client),
    ]);

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    let reviewList = await reviewDB.getReviewListByUniversityId(
      client,
      req.user.id,
      universityId,
      postType.REVIEW,
      invisibleUserIds,
    );

    reviewList = reviewList.map((review) => {
      // 태그 정보
      review.tagList = _.filter(relationReviewTagList, (r) => r.postId === review.id).map((o) => {
        return { tagName: o.tagName };
      });

      return {
        postId: review.id,
        oneLineReview: review.oneLineReview,
        majorName: review.majorName,
        createdAt: review.createdAt,
        tagList: review.tagList,
        like: {
          isLiked: review.isLiked,
          likeCount: review.likeCount,
        },
      };
    });

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, reviewList));
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
