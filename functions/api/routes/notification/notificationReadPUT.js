const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { notificationDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

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

    // 알림 읽으면 해당 알림과 postId가 같은 알림은 모두 isRead true로
    const updatedNotifications = await notificationDB.updateNotificationListByIsRead(
      client,
      notification.postId,
      notification.receiverId,
      true,
    );

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
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
