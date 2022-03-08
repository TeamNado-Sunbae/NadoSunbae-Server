const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewPostDB, likeDB, relationReviewPostTagDB, userDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const postType = require("../../../constants/postType");

module.exports = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);
    let reviewPostList = await reviewPostDB.getReviewPostListByUserId(client, userId);

    // 해당 유저의 후기글이 하나도 없을 경우
    if (reviewPostList.length === 0) {
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.NO_CONTENT, responseMessage.NO_CONTENT, reviewPostList));
    }

    let writer = await userDB.getUserByUserId(client, userId);

    // 해당 유저 정보
    writer = {
      writerId: writer.id,
      nickname: writer.nickname,
    };

    reviewPostList = await Promise.all(
      reviewPostList.map(async (reviewPost) => {
        const tagNameList = await relationReviewPostTagDB.getTagListByPostId(client, reviewPost.id);

        // 좋아요 정보
        const likeData = await likeDB.getLikeByPostId(
          client,
          reviewPost.id,
          postType.REVIEW,
          req.user.id,
        );

        const isLiked = likeData ? likeData.isLiked : false;

        const likeCount = await likeDB.getLikeCountByPostId(client, reviewPost.id, postType.REVIEW);
        const like = {
          isLiked: isLiked,
          likeCount: likeCount.likeCount,
        };

        return {
          postId: reviewPost.id,
          majorName: reviewPost.majorName,
          oneLineReview: reviewPost.oneLineReview,
          createdAt: reviewPost.createdAt,
          tagList: tagNameList,
          like: like,
        };
      }),
    );

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, {
        writer,
        reviewPostList,
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
