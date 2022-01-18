const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { notificationDB } = require("../../../db");

module.exports = async (req, res) => {
  const { notificationId } = req.params;

  // params 값이 없을 경우
  if (!notificationId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);

    // 로그인 한 유저가 알림 삭제하는 유저가 아닌 경우 403 error 반환
    const notification = await notificationDB.getNotificationByNotificationId(
      client,
      notificationId,
    );
    if (!notification) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_NOTIFICATION));
    }

    if (notification.receiverId !== req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
    }

    // 알림 삭제
    let deletedNotification = await notificationDB.deleteNotificationByNotificationId(
      client,
      notificationId,
    );

    if (!deletedNotification) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_NOTIFICATION));
    }

    // response로 보낼 isDeleted
    const isDeleted = deletedNotification.isDeleted;

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.DELETE_ONE_POST_SUCCESS, {
          notificationId,
          isDeleted,
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
