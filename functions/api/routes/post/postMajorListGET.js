const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, likeDB, blockDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const postType = require("../../../constants/postType");

module.exports = async (req, res) => {
  const { postTypeId, majorId } = req.params;
  const { sort } = req.query;

  if (!postTypeId || !majorId || !sort) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  if (
    Number(postTypeId) !== postType.INFORMATION &&
    Number(postTypeId) !== postType.QUESTION_TO_EVERYONE
  ) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_POST_TYPE_ID));
  }

  let client;

  try {
    client = await db.connect(req);

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    let postList = await postDB.getPostListByMajorId(client, majorId, postTypeId, invisibleUserIds);

    const likeList = await likeDB.getLikeListByUserId(client, req.user.id);

    postList = postList.map((post) => {
      // 좋아요 정보
      const likeData = _.find(likeList, {
        postId: post.id,
        postTypeId: post.postTypeId,
      });

      const isLiked = likeData ? likeData.isLiked : false;

      return {
        postId: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        writer: {
          writerId: post.writerId,
          profileImageId: post.profileImageId,
          nickname: post.nickname,
        },
        like: {
          isLiked: isLiked,
          likeCount: post.likeCount,
        },
        commentCount: post.commentCount,
      };
    });

    if (sort === "recent") {
      postList = _.sortBy(postList, "createdAt").reverse();
    } else if (sort === "like") {
      postList = _.sortBy(postList, ["like.likeCount", "like.isLiked"]).reverse();
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_SORT));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, postList));
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
