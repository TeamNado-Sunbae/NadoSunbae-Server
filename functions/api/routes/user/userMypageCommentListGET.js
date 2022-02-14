const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, likeDB, commentDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  let { postTypeId } = req.params;
  if (!postTypeId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  postTypeId = Number(postTypeId);

  let client;

  try {
    client = await db.connect(req);

    let commentWriterId = req.user.id;

    // 유저가 작성한 답글이 있는 질문글, 정보글 조회
    let classroomPostList = await commentDB.getClassroomPostListByMyCommentList(
      client,
      commentWriterId,
      postTypeId,
    );

    if (!classroomPostList) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    const data = await Promise.all(
      classroomPostList.map(async (classroomPostList) => {
        let writer = await userDB.getUserByUserId(client, classroomPostList.writerId);
        let likeCount = await likeDB.getLikeCountByPostId(client, classroomPostList.id, postTypeId);
        let commentCount = await commentDB.getCommentCountByPostId(client, classroomPostList.id);
        return {
          postId: classroomPostList.id,
          title: classroomPostList.title,
          content: classroomPostList.content,
          createdAt: classroomPostList.createdAt,
          writer: {
            writerId: writer.id,
            profileImageId: writer.profileImageId,
            nickname: writer.nickname,
          },
          likeCount: likeCount.likeCount,
          commentCount: commentCount.commentCount,
        };
      }),
    );

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ONE_POST_SUCCESS, {
        data,
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
