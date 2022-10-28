const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { commentDB, userDB, postDB, notificationDB, blockDB } = require("../../../db");
const { postType, notificationType } = require("../../../constants/type");
const pushAlarmHandlers = require("../../../lib/pushAlarmHandlers");
const errorHandlers = require("../../../lib/errorHandlers");

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

    // 1대 1 질문글인 경우
    // 원글 작성자와 답변자만 댓글 등록 가능
    const postData = await postDB.getPostByPostId(client, postId);
    if (!postData) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    if (postData.postTypeId === postType.QUESTION_TO_PERSON) {
      if (postData.writerId !== req.user.id && postData.answererId !== req.user.id) {
        return res
          .status(statusCode.FORBIDDEN)
          .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
      }
    }

    // 댓글 등록
    let comment = await commentDB.createComment(client, postId, req.user.id, content);

    const writer = {
      writerId: req.user.id,
      profileImageId: req.user.profileImageId,
      nickname: req.user.nickname,
      firstMajorName: req.user.firstMajorName,
      firstMajorStart: req.user.firstMajorStart,
      secondMajorName: req.user.secondMajorName,
      secondMajorStart: req.user.secondMajorStart,
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
      .status(statusCode.CREATED)
      .send(util.success(statusCode.CREATED, responseMessage.CREATE_ONE_COMMENT_SUCCESS, comment));

    // ******************************************************************************************
    // notification DB 저장 및 푸시 알림 전송

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    const notificationTitle = "나도선배";
    const commentPost = await postDB.getPostByPostId(client, comment.postId);
    const sender = await userDB.getUserByUserId(client, comment.writer.writerId);

    let receiver, unicastNotificationTypeId, unicastNotificationContent;
    let receivers, multicastNotificationTypeId, multicastNotificationContent;

    if (commentPost.postTypeId === postType.QUESTION_TO_PERSON) {
      // question to person - answerer comment
      if (
        comment.writer.writerId === commentPost.answererId &&
        invisibleUserIds.indexOf(commentPost.writerId) === -1
      ) {
        receiver = await userDB.getUserByUserId(client, commentPost.writerId);
        unicastNotificationTypeId = notificationType.QUESTION_TO_PERSON_ANSWERER_COMMENT_ALARM;
        unicastNotificationContent = `작성하신 1:1 질문글에 ${sender.nickname} 님이 답글을 남겼습니다.`;

        // question to person - writer comment
      } else if (
        comment.writer.writerId === commentPost.writerId &&
        invisibleUserIds.indexOf(commentPost.answererId) === -1
      ) {
        receiver = await userDB.getUserByUserId(client, commentPost.answererId);
        unicastNotificationTypeId = notificationType.QUESTION_TO_PERSON_WRITER_COMMENT_ALARM;
        unicastNotificationContent = `${sender.nickname}님이 1:1 질문글에 답글을 남겼습니다.`;
      }
    } else if (
      commentPost.postTypeId === postType.GENERAL ||
      commentPost.postTypeId === postType.INFORMATION ||
      commentPost.postTypeId === postType.QUESTION_TO_EVERYONE
    ) {
      // community
      receiver = await userDB.getUserByUserId(client, commentPost.writerId);
      unicastNotificationTypeId = notificationType.MY_COMMUNITY_COMMENT_ALARM;
      unicastNotificationContent = `작성하신 커뮤니티 글에 ${sender.nickname}님이 답글을 남겼습니다.`;

      receivers = await userDB.getUserListByCommentPostId(client, comment.postId, invisibleUserIds);
      multicastNotificationTypeId = notificationType.COMMENT_COMMUNITY_COMMENT_ALARM;
      multicastNotificationContent = `답글을 작성하신 커뮤니티 글에 ${sender.nickname}님이 답글을 남겼습니다.`;
    }

    // for unicast
    if (receiver && receiver.id !== sender.id) {
      notificationDB.createNotification(
        client,
        sender.id,
        receiver.id,
        comment.postId,
        unicastNotificationTypeId,
        comment.content,
        comment.commentId,
        commentPost.postTypeId,
      );

      // 푸시 알림 전송
      if (receiver.deviceToken) {
        pushAlarmHandlers.sendUnicast(
          receiver.deviceToken,
          notificationTitle,
          unicastNotificationContent,
        );
      }
    }

    // for multicast
    if (receivers) {
      const receiverTokens = [];
      receivers.map((receiver) => {
        if (receiver.id !== sender.id && receiver.id !== commentPost.writerId) {
          notificationDB.createNotification(
            client,
            sender.id,
            receiver.id,
            comment.postId,
            multicastNotificationTypeId,
            comment.content,
            comment.commentId,
            commentPost.postTypeId,
          );

          if (receiver.deviceToken) {
            receiverTokens.push(receiver.deviceToken);
          }
        }
      });

      // 푸시 알림 전송
      pushAlarmHandlers.sendMulticast(
        receiverTokens,
        notificationTitle,
        multicastNotificationContent,
      );
    }
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
