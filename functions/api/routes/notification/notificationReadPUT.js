const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { notificationDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { notificationId } = req.params;

  if (!notificationId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    const notification = await notificationDB.getNotificationByNotificationId(
      client,
      notificationId,
    );
    if (!notification) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_NOTIFICATION));
    }

    // 로그인 한 유저가 알림 읽는 유저가 아닌 경우 403 error 반환
    if (notification.receiverId !== req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
    }

    // 알림 읽으면 isRead 업데이트

    // 해당 알림과 postId가 같은 알림은 모두 업데이트함

    let updatedNotifications = await notificationDB.updateNotificationListByIsRead(
      client,
      notification.postId,
      notification.receiverId,
      true,
    );
    if (!updatedNotifications) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_NOTIFICATION));
    }

    updatedNotifications = updatedNotifications.map((notification) => {
      return {
        notificationId: notification.id,
        notificationPostId: notification.postId,
        receiverId: notification.receiverId,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        isDeleted: notification.isDeleted,
      };
    });

    res
      .status(statusCode.OK)
      .send(
        util.success(
          statusCode.OK,
          responseMessage.READ_ONE_NOTIFICATION_SUCCESS,
          updatedNotifications,
        ),
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
