const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewPostDB, likeDB, majorDB, relationReviewPostTagDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const user = req.user;

  let client;

  try {
    client = await db.connect(req);
    let reviewPostList = await reviewPostDB.getReviewPostByUserId(client, user.id);

    // 해당 유저의 후기글이 하나도 없을 경우
    if (reviewPostList.length === 0) {
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.NO_CONTENT, reviewPostList));
    }

    // 해당 유저 정보
    const writer = {
      writerId: user.id,
      profileImageId: user.profileImageId,
      nickname: user.nickname,
    };

    reviewPostList = await Promise.all(
      reviewPostList.map(async (reviewPost) => {
        const majorName = await majorDB.getMajorNameByMajorId(client, reviewPost.majorId);

        const tagList = await relationReviewPostTagDB.getTagListByPostId(client, reviewPost.id);
        const likeCount = await likeDB.getLikeCountByPostId(client, reviewPost.id, 1);

        return {
          postId: reviewPost.id,
          majorName: majorName.majorName,
          oneLineReview: reviewPost.oneLineReview,
          createdAt: reviewPost.createdAt,
          tagList: tagList,
          likeCount: likeCount.likeCount,
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
