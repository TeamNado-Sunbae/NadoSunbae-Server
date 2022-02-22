const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const {
  reviewPostDB,
  userDB,
  likeDB,
  majorDB,
  relationReviewPostTagDB,
  blockDB,
} = require("../../../db");
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
      );
    } else if (writerFilter === 2) {
      // 본전공 필터만 선택
      reviewPostList = await reviewPostDB.getReviewPostListByFilters(
        client,
        majorId,
        [true],
        tagFilter,
        invisibleUserIds,
      );
    } else if (writerFilter === 3) {
      // 제 2전공 필터만 선택
      reviewPostList = await reviewPostDB.getReviewPostListByFilters(
        client,
        majorId,
        [false],
        tagFilter,
        invisibleUserIds,
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
        .send(util.success(statusCode.OK, responseMessage.NO_CONTENT, reviewPostList));
    }

    reviewPostList = await Promise.all(
      reviewPostList.map(async (reviewPost) => {
        let writer = await userDB.getUserByUserId(client, reviewPost.writerId);
        const firstMajorName = await majorDB.getMajorNameByMajorId(client, writer.firstMajorId);
        const secondMajorName = await majorDB.getMajorNameByMajorId(client, writer.secondMajorId);

        writer = {
          writerId: writer.id,
          profileImageId: writer.profileImageId,
          nickname: writer.nickname,
          firstMajorName: firstMajorName.majorName,
          firstMajorStart: writer.firstMajorStart,
          secondMajorName: secondMajorName.majorName,
          secondMajorStart: writer.secondMajorStart,
        };

        const tagList = await relationReviewPostTagDB.getTagListByPostId(client, reviewPost.postId);

        // 좋아요 정보
        const likeData = await likeDB.getLikeByPostId(
          client,
          reviewPost.postId,
          postType.REVIEW,
          req.user.id,
        );
        let isLiked;
        if (!likeData) {
          isLiked = false;
        } else {
          isLiked = likeData.isLiked;
        }
        const likeCount = await likeDB.getLikeCountByPostId(
          client,
          reviewPost.postId,
          postType.REVIEW,
        );
        const like = {
          isLiked: isLiked,
          likeCount: likeCount.likeCount,
        };

        return {
          postId: reviewPost.postId,
          oneLineReview: reviewPost.oneLineReview,
          createdAt: reviewPost.createdAt,
          writer: writer,
          tagList: tagList,
          like: like,
        };
      }),
    );

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
