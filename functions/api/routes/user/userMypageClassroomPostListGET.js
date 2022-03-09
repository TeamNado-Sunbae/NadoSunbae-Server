const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, likeDB, commentDB, blockDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const postType = require("../../../constants/postType");

module.exports = async (req, res) => {
  const { type } = req.query;

  if (!type) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let classroomPostList;

    // 정보글일 경우 postypeId === 2
    if (type === "information") {
      classroomPostList = await classroomPostDB.getMyClassroomPostListByPostTypeIds(
        client,
        req.user.id,
        [postType.INFORMATION],
      );
    }
    // 질문글일 경우 postypeId === 3(전체) or 4(1:1)
    else if (type === "question") {
      classroomPostList = await classroomPostDB.getMyClassroomPostListByPostTypeIds(
        client,
        req.user.id,
        [postType.QUESTION_TO_EVERYONE, postType.QUESTION_TO_PERSON],
      );
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_FILTER));
    }

    classroomPostList = await Promise.all(
      classroomPostList.map(async (classroomPost) => {
        // 댓글 개수

        // 내가 차단한 사람과 나를 차단한 사람을 block
        const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
        const invisibleUserIds = _.map(invisibleUserList, "userId");

        const commentCount = await commentDB.getCommentCountByPostId(
          client,
          classroomPost.id,
          invisibleUserIds,
        );

        // 좋아요 정보
        const likeData = await likeDB.getLikeByPostId(
          client,
          classroomPost.id,
          classroomPost.postTypeId,
          req.user.id,
        );

        const isLiked = likeData ? likeData.isLiked : false;

        const likeCount = await likeDB.getLikeCountByPostId(
          client,
          classroomPost.id,
          classroomPost.postTypeId,
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
          majorName: classroomPost.majorName,
          createdAt: classroomPost.createdAt,
          commentCount: commentCount.commentCount,
          like: like,
        };
      }),
    );

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
