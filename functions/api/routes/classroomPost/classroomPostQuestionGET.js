const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const postType = require("../../../constants/postType");
const db = require("../../../db/db");
const { classroomPostDB, userDB, likeDB, commentDB, blockDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { postId } = req.params;
  if (!postId)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    let classroomPost = await classroomPostDB.getClassroomPostByPostId(client, postId);
    if (!classroomPost) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    // questioner, answerer 정보
    const questionerId = classroomPost.writerId;
    const answererId = classroomPost.answererId;

    // post 좋아요 정보

    // answererId 여부에 따라 1:1 질문인지, 전체 질문인지 판단
    const postTypeId = answererId ? postType.QUESTION_TO_PERSON : postType.QUESTION_TO_EVERYONE;

    // 로그인 유저가 좋아요한 상태인지
    const like = await likeDB.getLikeByPostId(client, classroomPost.id, postTypeId, req.user.id);

    const isLiked = like ? like.isLiked : false;

    // post 좋아요 개수
    const likeCount = await likeDB.getLikeCountByPostId(client, classroomPost.id, postTypeId);

    // post 작성자 정보
    let writer = await userDB.getUserByUserId(client, classroomPost.writerId);

    writer = {
      writerId: writer.id,
      profileImageId: writer.profileImageId,
      isQuestioner: true,
      nickname: writer.nickname,
      firstMajorName: writer.firstMajorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: writer.secondMajorName,
      secondMajorStart: writer.secondMajorStart,
    };

    // post 정보
    const post = {
      messageId: classroomPost.id,
      title: classroomPost.title,
      content: classroomPost.content,
      createdAt: classroomPost.createdAt,
      isDeleted: classroomPost.isDeleted,
      writer: writer,
    };

    // post 댓글 정보

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    // post 댓글 리스트 - 삭제 댓글 포함
    let messageList = await commentDB.getCommentListByPostId(
      client,
      classroomPost.id,
      invisibleUserIds,
    );

    messageList = messageList.map((comment) => {
      const content = comment.isDeleted ? "(삭제된 답글입니다.)" : comment.content;

      const commentWriter = {
        writerId: comment.writerId,
        profileImageId: comment.profileImageId,
        isQuestioner: comment.writerId === classroomPost.writerId,
        nickname: comment.nickname,
        firstMajorName: comment.firstMajorName,
        firstMajorStart: comment.firstMajorStart,
        secondMajorName: comment.secondMajorName,
        secondMajorStart: comment.secondMajorStart,
      };

      return {
        messageId: comment.id,
        title: "",
        content: content,
        createdAt: comment.createdAt,
        isDeleted: comment.isDeleted,
        writer: commentWriter,
      };
    });

    // 메세지 리스트 앞에 원글 포함
    messageList.unshift(post);

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ONE_POST_SUCCESS, {
        questionerId,
        answererId,
        like: {
          isLiked: isLiked,
          likeCount: likeCount.likeCount,
        },
        messageList,
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
