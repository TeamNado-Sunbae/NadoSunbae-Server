const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { notificationDB, userDB } = require("../../../db");

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

    let notificationList = await notificationDB.getNotificationListByReceiverId(client, receiverId);

    notificationList = await Promise.all(
      notificationList.map(async (notification) => {
        let sender = await userDB.getUserByUserId(client, notification.senderId);
        sender = {
          senderId: sender.id,
          nickname: sender.nickname,
          profileImageId: sender.profileImageId,
        };

        return {
          notificationId: notification.id,
          sender: sender,
          postId: notification.postId,
          notificationType: notification.notificationType,
          content: notification.content,
          isRead: notification.isRead,
          isDeleted: notification.isDeleted,
          createdAt: notification.createdAt,
        };
      }),
    );

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

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
