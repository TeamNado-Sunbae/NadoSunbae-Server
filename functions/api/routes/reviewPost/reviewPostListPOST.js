const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewPostDB, likeDB, relationReviewPostTagDB, blockDB } = require("../../../db");
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

    let reviewPostList;
    if (writerFilter === 1) {
      // 전체 목록 조회
      reviewPostList = await reviewPostDB.getReviewPostListByFilters(
        client,
        majorId,
        [true, false],
        tagFilter,
        invisibleUserIds,
        postType.REVIEW,
      );
    } else if (writerFilter === 2) {
      // 본전공 필터만 선택
      reviewPostList = await reviewPostDB.getReviewPostListByFilters(
        client,
        majorId,
        [true],
        tagFilter,
        invisibleUserIds,
        postType.REVIEW,
      );
    } else if (writerFilter === 3) {
      // 제 2전공 필터만 선택
      reviewPostList = await reviewPostDB.getReviewPostListByFilters(
        client,
        majorId,
        [false],
        tagFilter,
        invisibleUserIds,
        postType.REVIEW,
      );
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_FILTER));
    }

    // 해당 과에 후기 글이 없을 경우
    if (reviewPostList.length === 0) {
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.NO_CONTENT, responseMessage.NO_CONTENT, reviewPostList));
    }

    const relationReviewPostTagList = await relationReviewPostTagDB.getRelationReviewPostTagList(
      client,
    );

    const likeList = await likeDB.getLikeListByUserId(client, req.user.id);

    reviewPostList = reviewPostList.map((reviewPost) => {
      const writer = {
        writerId: reviewPost.writerId,
        profileImageId: reviewPost.profileImageId,
        nickname: reviewPost.nickname,
        firstMajorName: reviewPost.firstMajorName,
        firstMajorStart: reviewPost.firstMajorStart,
        secondMajorName: reviewPost.secondMajorName,
        secondMajorStart: reviewPost.secondMajorStart,
      };

      // 태그 정보
      reviewPost.tagList = _.filter(
        relationReviewPostTagList,
        (r) => r.postId === reviewPost.id,
      ).map((o) => {
        return { tagName: o.tagName };
      });

      // 좋아요 정보
      const likeData = _.find(likeList, {
        postId: reviewPost.id,
        postTypeId: postType.REVIEW,
      });

      const isLiked = likeData ? likeData.isLiked : false;

      // for test
      if (reviewPost.id === 8) {
        reviewPost.likeCount = 123;
      }

      return {
        postId: reviewPost.id,
        oneLineReview: reviewPost.oneLineReview,
        createdAt: reviewPost.createdAt,
        writer: writer,
        tagList: reviewPost.tagList,
        like: {
          isLiked: isLiked,
          likeCount: reviewPost.likeCount,
        },
      };
    });

    if (sort === "recent") {
      reviewPostList = _.sortBy(reviewPostList, "createdAt").reverse();
    } else if (sort === "like") {
      reviewPostList = _.sortBy(reviewPostList, ["like.likeCount", "like.isLiked"]).reverse();
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_SORT));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, reviewPostList));
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
