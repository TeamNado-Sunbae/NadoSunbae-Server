const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, likeDB, userDB, commentDB, blockDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const postType = require("../../../constants/postType");

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

    let classroomPostList = await classroomPostDB.getClassroomPostListByUserId(
      client,
      userId,
      invisibleUserIds,
    );

    // classroomPostList에 작성자 정보와 댓글 개수, 좋아요 개수를 붙임
    classroomPostList = await Promise.all(
      classroomPostList.map(async (classroomPost) => {
        let writer = await userDB.getUserByUserId(client, classroomPost.writerId);
        // 작성자 정보
        writer = {
          writerId: writer.id,
          profileImageId: writer.profileImageId,
          nickname: writer.nickname,
        };

        // 댓글 개수
        const commentCount = await commentDB.getCommentCountByPostId(
          client,
          classroomPost.id,
          invisibleUserIds,
        );

        // 좋아요 정보
        const likeData = await likeDB.getLikeByPostId(
          client,
          classroomPost.id,
          postType.QUESTION_TO_PERSON,
          req.user.id,
        );

        const isLiked = likeData ? likeData.isLiked : false;

        const likeCount = await likeDB.getLikeCountByPostId(
          client,
          classroomPost.id,
          postType.QUESTION_TO_PERSON,
        );
        const like = {
          isLiked: isLiked,
          likeCount: likeCount.likeCount,
        };

        return {
          postId: classroomPost.id,
          postTypeId: classroomPost.postTypeId,
          title: classroomPost.title,
          content: classroomPost.content,
          createdAt: classroomPost.createdAt,
          writer: writer,
          commentCount: commentCount.commentCount,
          like: like,
        };
      }),
    );

    if (sort === "recent") {
      classroomPostList = _.sortBy(classroomPostList, "createdAt").reverse();
    } else if (sort === "like") {
      classroomPostList = _.sortBy(classroomPostList, ["like.likeCount", "like.isLiked"]).reverse();
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_SORT));
    }

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, { classroomPostList }),
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
