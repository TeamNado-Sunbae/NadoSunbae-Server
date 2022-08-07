const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewDB, likeDB, relationReviewTagDB, blockDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const postType = require("../../../constants/postType");

module.exports = async (req, res) => {
  const { sort } = req.query;
  const { majorId, writerFilter, tagFilter } = req.body;

  if (!majorId || !writerFilter || !tagFilter || !sort) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    let isFirstMajor;
    if (writerFilter === "all") {
      isFirstMajor = [true, false];
    } else if (writerFilter === "firstMajor") {
      isFirstMajor = [true];
    } else if (writerFilter === "secondMajor") {
      isFirstMajor = [false];
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_FILTER));
    }

    let reviewList = await reviewDB.getReviewListByFilters(
      client,
      majorId,
      isFirstMajor,
      tagFilter,
      invisibleUserIds,
      postType.REVIEW,
    );

    // 해당 과에 후기 글이 없을 경우
    if (reviewList.length === 0) {
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.NO_CONTENT, responseMessage.NO_CONTENT, reviewList));
    }

    const relationReviewTagList = await relationReviewTagDB.getRelationReviewTagList(client);

    const likeList = await likeDB.getLikeListByUserId(client, req.user.id);

    reviewList = reviewList.map((review) => {
      const writer = {
        writerId: review.writerId,
        profileImageId: review.profileImageId,
        nickname: review.nickname,
        firstMajorName: review.firstMajorName,
        firstMajorStart: review.firstMajorStart,
        secondMajorName: review.secondMajorName,
        secondMajorStart: review.secondMajorStart,
      };

      // 태그 정보
      review.tagList = _.filter(relationReviewTagList, (r) => r.postId === review.id).map((o) => {
        return { tagName: o.tagName };
      });

      // 좋아요 정보
      const likeData = _.find(likeList, {
        postId: review.id,
        postTypeId: postType.REVIEW,
      });

      const isLiked = likeData ? likeData.isLiked : false;

      return {
        postId: review.id,
        oneLineReview: review.oneLineReview,
        createdAt: review.createdAt,
        writer: writer,
        tagList: review.tagList,
        like: {
          isLiked: isLiked,
          likeCount: review.likeCount,
        },
      };
    });

    if (sort === "recent") {
      reviewList = _.sortBy(reviewList, "createdAt").reverse();
    } else if (sort === "like") {
      reviewList = _.sortBy(reviewList, ["like.likeCount", "like.isLiked"]).reverse();
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_SORT));
    }

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
