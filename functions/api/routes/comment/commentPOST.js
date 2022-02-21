const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const {
  commentDB,
  userDB,
  majorDB,
  classroomPostDB,
  notificationDB,
  blockDB,
} = require("../../../db");
const notificationType = require("../../../constants/notificationType");
const postType = require("../../../constants/postType");
const slackAPI = require("../../../middlewares/slackAPI");
const pushAlarmHandlers = require("../../../lib/pushAlarmHandlers");

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
    if (postData.postTypeId === postType.QUESTION_TO_PERSON) {
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

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.CREATE_ONE_COMMENT_SUCCESS, comment));

    // notification DB 저장 및 푸시 알림 전송

    // 푸시 알림 제목은 나도선배 통일
    const notificationTitle = "나도선배";

    // 댓글이 작성된 게시글, 추후 댓글 생성 시 댓글 객체만 받아와도 기능할 수 있도록 구현
    const commentPost = await classroomPostDB.getClassroomPostByPostId(client, comment.postId);

    // sender는 댓글 작성자
    const sender = await userDB.getUserByUserId(client, comment.writer.writerId);

    // ******** 게시글 작성자에게 보내는 Unicast Alarm 을 위한 변수 설정********

    // receiver는 게시글 작성자
    const receiver = await userDB.getUserByUserId(client, commentPost.writerId);

    let UnicastNotificationTypeId;
    let UnicastNotificationContent;

    // ******** 댓글 작성자들에게 보내는 Multicast Alarm 을 위한 변수 설정********

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    // receiver는 게시글에 달린 댓글 작성자들 (중복된 작성자 제외)
    const receivers = await userDB.getUserListByCommentPostId(
      client,
      comment.postId,
      invisibleUserIds,
    );

    let MulticastNotificationTypeId;
    let MulticastNotificationContent;

    // ********************************************************************

    // notification DB 저장 및 푸시 알림 전송을 위한 case 설정 - notificationType 1은 마이페이지 관련

    if (
      commentPost.postTypeId === postType.QUESTION_TO_EVERYONE ||
      commentPost.postTypeId == postType.QUESTION_TO_PERSON
    ) {
      // [ notificationType 2: 내가 쓴 글에 답글이 달린 경우 - 질문글 ]
      UnicastNotificationTypeId = notificationType.MY_QUESTION_COMMENT_ALARM;
      UnicastNotificationContent = `작성하신 질문글에 ${sender.nickname}님이 답글을 남겼습니다.`;

      // [ notificationType 4: 내가 답글을 쓴 타인 글에 새 답글이 달린 경우 - 질문글 ]
      MulticastNotificationTypeId = notificationType.OTHER_QUESTION_COMMENT_ALARM;
      MulticastNotificationContent = `답글을 작성하신 질문글에 ${sender.nickname}님이 답글을 남겼습니다.`;
    } else if (commentPost.postTypeId === postType.INFORMATION) {
      // [ notificationType 3: 내가 쓴 글에 답글이 달린 경우 - 정보글 ]
      UnicastNotificationTypeId = notificationType.MY_INFORMATION_COMMENT_ALARM;
      UnicastNotificationContent = `작성하신 정보글에 ${sender.nickname}님이 답글을 남겼습니다.`;

      // [ notificationType 5: 내가 답글을 쓴 타인 글에 새 답글이 달린 경우 - 정보글 ]
      MulticastNotificationTypeId = notificationType.OTHER_INFORMATION_COMMENT_ALARM;
      MulticastNotificationContent = `답글을 작성하신 정보글에 ${sender.nickname}님이 답글을 남겼습니다.`;
    }

    // notification DB에 알림 저장
    if (receiver.id !== sender.id) {
      await notificationDB.createNotification(
        client,
        sender.id,
        receiver.id,
        comment.postId,
        UnicastNotificationTypeId,
        comment.content,
        comment.commentId,
        commentPost.postTypeId,
      );

      // 푸시 알림 전송
      if (receiver.deviceToken) {
        pushAlarmHandlers.sendUnicast(
          receiver.deviceToken,
          notificationTitle,
          UnicastNotificationContent,
        );
      }
    }

    // notification DB에 알림 저장 및 receiverTokens 값 저장
    const receiverTokens = [];
    await Promise.all(
      receivers.map(async (receiver) => {
        if (receiver.id !== sender.id && receiver.id !== commentPost.writerId) {
          await notificationDB.createNotification(
            client,
            sender.id,
            receiver.id,
            comment.postId,
            MulticastNotificationTypeId,
            comment.content,
            comment.commentId,
            commentPost.postTypeId,
          );
          // 댓글 리스트에 있는 유저들의 디바이스 토큰 정보 저장
          if (receiver.deviceToken) {
            receiverTokens.push(receiver.deviceToken);
          }
        }
      }),
    );

    // 푸시 알림 전송
    pushAlarmHandlers.sendMulticast(
      receiverTokens,
      notificationTitle,
      MulticastNotificationContent,
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
