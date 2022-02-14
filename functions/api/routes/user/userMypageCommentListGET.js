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

    // 마이페이지 주인장 id
    const commentWriterId = req.user.id;

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

    const classroomPostListByMyCommentList = await Promise.all(
      classroomPostList.map(async (classroomPost) => {
        let writer = await userDB.getUserByUserId(client, classroomPost.writerId);

        let like = await likeDB.getLikeByPostId(
          client,
          classroomPost.id,
          postTypeId,
          classroomPost.writerId,
        );
        let isLiked;
        if (!like) {
          isLiked = false;
        } else {
          isLiked = like.isLiked;
        }
        let likeCount = await likeDB.getLikeCountByPostId(client, classroomPost.id, postTypeId);
        like = {
          isLiked: isLiked,
          likeCount: likeCount.likeCount,
        };

        let commentCount = await commentDB.getCommentCountByPostId(client, classroomPost.id);
        return {
          postId: classroomPost.id,
          title: classroomPost.title,
          content: classroomPost.content,
          createdAt: classroomPost.createdAt,
          writer: {
            writerId: writer.id,
            profileImageId: writer.profileImageId,
            nickname: writer.nickname,
          },
          like: like,
          commentCount: commentCount.commentCount,
        };
      }),
    );

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ONE_POST_SUCCESS, {
        classroomPostListByMyCommentList,
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
