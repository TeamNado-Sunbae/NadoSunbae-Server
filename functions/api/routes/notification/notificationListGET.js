const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { notificationDB, postDB, commentDB, blockDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");
const { notificationType } = require("../../../constants/type");

module.exports = async (req, res) => {
  let client;

  try {
    client = await db.connect(req);

    const [invisibleUserList, postList, commentList] = await Promise.all([
      blockDB.getInvisibleUserListByUserId(client, req.user.id),
      postDB.getPostListByNotification(client),
      commentDB.getCommentListByNotification(client),
    ]);

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    let notificationList = await notificationDB.getNotificationList(
      client,
      req.user.id,
      invisibleUserIds,
    );

    notificationList = notificationList.map((notification) => {
      const notificationPost = _.find(postList, { id: notification.postId });
      const isPostDeleted = notificationPost ? notificationPost.isDeleted : true;

      const notificationComment = _.find(commentList, { id: notification.commentId });
      const isCommentDeleted = notificationComment ? notificationComment.isDeleted : true;

      // content 내용은 본글과 댓글이 삭제된 경우에만 변경
      let content;
      if (isPostDeleted) {
        content = "삭제된 게시글입니다.";
      } else if (notification.commentId && isCommentDeleted) {
        content = "삭제된 답글입니다.";
      } else {
        content = notification.content;
      }

      return {
        notificationId: notification.id,
        sender: {
          senderId:
            notification.notificationTypeId === notificationType.COMMUNITY_ALARM
              ? notification.majorId
              : notification.senderId,
          nickname:
            notification.notificationTypeId === notificationType.COMMUNITY_ALARM
              ? notification.majorName
              : notification.senderNickname,
          profileImageId: notification.senderProfileImageId,
        },
        isRead: notification.isRead,
        content: content,
        createdAt: notification.createdAt,
        postId: notification.postId,
        commentId: notification.commentId,
        notificationTypeId: notification.notificationTypeId,
      };
    });

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ALL_NOTIFICATIONS_SUCCESS, {
        notificationList,
      }),
    );
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
