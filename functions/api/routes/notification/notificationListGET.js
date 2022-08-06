const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { notificationDB, postDB, commentDB, blockDB } = require("../../../db");
const postType = require("../../../constants/postType");
const slackAPI = require("../../../middlewares/slackAPI");
const notificationType = require("../../../constants/notificationType");

module.exports = async (req, res) => {
  const { receiverId } = req.params;

  if (!receiverId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);

    // 로그인 한 유저가 알림 리스트 조회하는 유저가 아닌 경우 403 error 반환
    if (Number(receiverId) !== req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
    }

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    let notificationList = await notificationDB.getNotificationListByReceiverId(
      client,
      receiverId,
      invisibleUserIds,
    );

    const postList = await postDB.getPostListByNotification(client);
    const commentList = await commentDB.getCommentListByNotification(client);

    notificationList = notificationList.map((notification) => {
      const notificationPost = _.find(postList, { id: notification.postId });
      const isPostDeleted = notificationPost ? notificationPost.isDeleted : true;

      // commentId 1:1 질문글 생성 알림의 경우에는 null - notification type QUESTION_TO_PERSON_ALARM
      let notificationComment;
      let isCommentDeleted;
      if (notification.commentId) {
        notificationComment = _.find(commentList, { id: notification.commentId });
        isCommentDeleted = notificationComment ? notificationComment.isDeleted : true;
      }

      // content 내용은 본글과 댓글이 삭제된 경우에만 변경
      let content;
      // 1:1 질문글이 삭제되었거나 댓글의 원본글(정보글, 질문글)이 삭제된 경우
      if (isPostDeleted) {
        content = "삭제된 게시글입니다.";
      } else if (
        // 댓글 알림이지만 댓글이 삭제된 경우
        notification.notificationTypeId !== notificationType.QUESTION_TO_PERSON_ALARM &&
        isCommentDeleted
      ) {
        content = "삭제된 답글입니다.";
      } else {
        content = notification.content;
      }

      const sender = {
        senderId: notification.senderId,
        nickname: notification.senderNickname,
        profileImageId: notification.senderProfileImageId,
      };

      return {
        notificationId: notification.id,
        sender: sender,
        postId: notification.postId,
        commentId: notification.commentId,
        postTypeId: notification.postTypeId,
        // 질문글이 1:1 질문인지 전체 질문인지 알기 위함
        isQuestionToPerson: notification.postTypeId === postType.QUESTION_TO_PERSON,
        notificationTypeId: notification.notificationTypeId,
        content: content,
        isRead: notification.isRead,
        isDeleted: notification.isDeleted,
        createdAt: notification.createdAt,
      };
    });

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ALL_NOTIFICATIONS_SUCCESS, {
        notificationList,
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
