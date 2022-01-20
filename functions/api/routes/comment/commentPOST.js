const functions = require("firebase-functions");
const util = require("../../../lib/util");
const { pushAlarm, pushAlarms } = require("../../../lib/pushAlarm");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const alarmMessage = require("../../../constants/alarmMessage");
const notificationType = require("../../../constants/notificationType");
const db = require("../../../db/db");
const { commentDB, userDB, majorDB, classroomPostDB, notificationDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { postId, content } = req.body;

  if (!postId || !content) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);
    const commentWriterId = req.user.id;

    // 1대 1 질문글인 경우
    // 원글 작성자와 답변자만 댓글 등록 가능
    const postData = await classroomPostDB.getClassroomPostByPostId(client, postId);
    if (!postData) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }
    if (postData.postTypeId === 4) {
      if (postData.writerId !== commentWriterId && postData.answererId !== commentWriterId) {
        return res
          .status(statusCode.FORBIDDEN)
          .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
      }
    }

    // 댓글 등록
    let comment = await commentDB.createComment(client, postId, commentWriterId, content);

    // 댓글 작성자 정보 가져오기
    let writer = await userDB.getUserByUserId(client, commentWriterId);
    const firstMajorName = await majorDB.getMajorNameByMajorId(client, writer.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, writer.secondMajorId);

    writer = {
      writerId: writer.id,
      profileImageId: writer.profileImageId,
      nickname: writer.nickname,
      firstMajorName: firstMajorName.majorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: secondMajorName.majorName,
      secondMajorStart: writer.secondMajorStart,
    };

    comment = {
      commentId: comment.id,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt,
      isDeleted: comment.isDeleted,
      writer: writer,
    };

    // 푸시알림 보내기

    // case1.원글 작성자에게 푸시알림 보내기

    // 알림을 받을 유저
    const receiver = await userDB.getUserByUserId(client, postData.writerId);
    // 알림을 보내는 유저
    const sender = req.user;

    let notificationTypeId;

    // 원글 작성자와 댓글 작성자가 다른 경우에만 푸시알림 전송
    if (receiver.id !== req.user.id) {
      // case1-1.정보글일 경우 - 정보글 작성자에게 푸시알림 전송
      if (postData.postTypeId === 2) {
        notificationTypeId = notificationType.MY_INFORMATION_COMMENT_ALARM;
        await pushAlarm(receiver.deviceToken, alarmMessage.MY_INFORMATION_POST, writer.nickname);
      } else {
        // case1-2.질문글일 경우 - 질문글 작성자에게 푸시알림 전송
        notificationTypeId = notificationType.MY_QUESTION_COMMENT_ALARM;
        await pushAlarm(receiver.deviceToken, alarmMessage.MY_QUESTION_POST, writer.nickname);
      }
      await notificationDB.createNotification(
        client,
        postData.id,
        notificationTypeId,
        sender.id,
        receiver.id,
        comment.content,
      );
    }

    /** case2.내가 쓴 댓글이 있는 타인의 글에 답변이 달린 경우
        댓글 리스트에 있는 댓글 작성자들한테 모두 푸시알림 보내기 (단, 원글이 내가 쓴 글일 경우 & 댓글 리스트에 내가 쓴 댓글이 있는 경우는 제외)
     **/

    // 댓글 작성자 리스트 가져오기
    let commentWriterList = await commentDB.getCommentWriter(client, postData.id, sender.id);

    // 배열에서 값만 가져오기
    commentWriterList = commentWriterList.map((commentWriters) => {
      return commentWriters.writerId;
    });

    // 가져온 리스트에서 중복 값 제거하기
    commentWriterList = [...new Set(commentWriterList)];

    // 알람을 받을 댓글 작성자들
    const receivers = await userDB.getUserListByCommentWriterId(client, commentWriterList);

    // case2-1.내가 쓴 댓글이 있는 타인의 정보글에 답변이 달린 경우
    const receiverTokens = [];
    if (postData.postTypeId === 2) {
      //receiverTokens 배열 값 저장 및 notification 생성
      await Promise.all(
        receivers.map(async (receiver) => {
          await notificationDB.createNotification(
            client,
            comment.postId,
            notificationType.OTHER_INFORMATION_COMMENT_ALARM,
            sender.id,
            receiver.id,
            comment.content,
          );
          receiverTokens.push(receiver.deviceToken);
        }),
      );

      if (receiverTokens.length !== 0) {
        await pushAlarms(receiverTokens, alarmMessage.ANSWER_TO_INFORMATION, writer.nickname);
      }
    } else {
      // case2-2.내가 쓴 댓글이 있는 타인의 질문글에 답변이 달린 경우
      //receiverTokens 배열 값 저장 및 notification 생성
      await Promise.all(
        receivers.map(async (receiver) => {
          await notificationDB.createNotification(
            client,
            comment.postId,
            notificationType.OTHER_QUESTION_COMMENT_ALARM,
            sender.id,
            receiver.id,
            comment.content,
          );
          receiverTokens.push(receiver.deviceToken);
        }),
      );

      if (receiverTokens.length !== 0) {
        await pushAlarms(receiverTokens, alarmMessage.ANSWER_TO_QUESTION, writer.nickname);
      }
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.CREATE_ONE_COMMENT_SUCCESS, comment));
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
