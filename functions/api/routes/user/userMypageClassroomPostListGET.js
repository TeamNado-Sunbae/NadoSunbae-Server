const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, likeDB, userDB, postTypeDB, commentDB, majorDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

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
      classroomPostList = await classroomPostDB.getMyClassroomPostListByPostTypeId(
        client,
        req.user.id,
        [2],
      );
    }
    // 질문글일 경우 postypeId === 3(전체) or 4(1:1)
    else if (type === "question") {
      classroomPostList = await classroomPostDB.getMyClassroomPostListByPostTypeId(
        client,
        req.user.id,
        [3, 4],
      );
    }

    classroomPostList = await Promise.all(
      classroomPostList.map(async (classroomPost) => {
        // 학과명
        const majorName = await majorDB.getMajorNameByMajorId(client, classroomPost.majorId);

        // 댓글 개수
        const commentCount = await commentDB.getCommentCountByPostId(client, classroomPost.id);

        // 좋아요 개수
        const likeCount = await likeDB.getLikeCountByPostId(
          client,
          classroomPost.id,
          classroomPost.postTypeId,
        );

        return {
          postId: classroomPost.id,
          title: classroomPost.title,
          content: classroomPost.content,
          majorName: majorName.majorName,
          createdAt: classroomPost.createdAt,
          commentCount: commentCount.commentCount,
          likeCount: likeCount.likeCount,
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
