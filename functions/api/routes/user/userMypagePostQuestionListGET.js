const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, likeDB, userDB, commentDB, blockDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const { likeType } = require("../../../constants/type");

module.exports = async (req, res) => {
  const { userId } = req.params;
  const { sort } = req.query;

  if (!userId || !sort) {
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

    let postList = await postDB.getPostListByUserId(client, userId, invisibleUserIds);

    // postList에 작성자 정보와 댓글 개수, 좋아요 개수를 붙임
    postList = await Promise.all(
      postList.map(async (post) => {
        let writer = await userDB.getUserByUserId(client, post.writerId);
        // 작성자 정보
        writer = {
          writerId: writer.id,
          profileImageId: writer.profileImageId,
          nickname: writer.nickname,
        };

        // 댓글 개수
        const commentCount = await commentDB.getCommentCountByPostId(
          client,
          post.id,
          invisibleUserIds,
        );

        // 좋아요 정보
        const likeData = await likeDB.getLikeByTarget(client, post.id, likeType.POST, req.user.id);

        const isLiked = likeData ? likeData.isLiked : false;

        const likeCount = await likeDB.getLikeCountByTarget(client, post.id, likeType.POST);
        const like = {
          isLiked: isLiked,
          likeCount: likeCount.likeCount,
        };

        return {
          postId: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          writer: writer,
          commentCount: commentCount.commentCount,
          like: like,
        };
      }),
    );

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
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, { postList }));
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
