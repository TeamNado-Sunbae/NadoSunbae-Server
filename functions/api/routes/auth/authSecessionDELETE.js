const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const { signInWithEmailAndPassword, deleteUser } = require("firebase/auth");
const { firebaseAuth } = require("../../../config/firebaseClient");
const db = require("../../../db/db");
const {
  userDB,
  blockDB,
  classroomPostDB,
  commentDB,
  likeDB,
  notificationDB,
  reportDB,
  reviewPostDB,
} = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { userId } = req.params;
  const { email, password } = req.body;

  if (!userId || !email || !password) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    if (userId != req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
    }

    // firebase 로그인
    const userFirebase = await signInWithEmailAndPassword(firebaseAuth, email, password)
      .then((user) => user)
      .catch((e) => {
        console.log(e);
        return { err: true, error: e };
      });

    // 에러 검증
    if (userFirebase.err) {
      if (userFirebase.error.code === "auth/user-not-found") {
        return res
          .status(statusCode.NOT_FOUND)
          .json(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
      } else if (userFirebase.error.code === "auth/invalid-email") {
        return res
          .status(statusCode.BAD_REQUEST)
          .json(util.fail(statusCode.BAD_REQUEST, responseMessage.INVALID_EMAIL));
      } else if (userFirebase.error.code === "auth/wrong-password") {
        return res
          .status(statusCode.BAD_REQUEST)
          .json(util.fail(statusCode.BAD_REQUEST, responseMessage.MISS_MATCH_PW));
      } else {
        return res
          .status(statusCode.INTERNAL_SERVER_ERROR)
          .json(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
      }
    }

    // firebase 로그인이 성공적으로 되었다면 계정 삭제
    await deleteUser(firebaseAuth.currentUser)
      .then(() => console.log("firebase 계정 삭제 성공"))
      .catch((error) => {
        console.log(error.code, error.message);
        return res
          .status(statusCode.INTERNAL_SERVER_ERROR)
          .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.DELETE_USER_FAIL));
      });

    // DB에서 유저 관련 정보 모두 삭제
    const userUpdatedByUserSecession = await userDB.deleteUserByUserSecession(client, userId);
    const blockUpdatedByUserSecession = await blockDB.deleteBlockByUserSecession(client, userId);
    const classroomPostUpdatedByUserSecession =
      await classroomPostDB.deleteClassroomPostByUserSecession(client, userId);
    const commentUpdatedByUserSecession = await commentDB.deleteCommetByUserSecession(
      client,
      userId,
    );
    const likeUpdatedByUserSecession = await likeDB.deleteLikeByUserSecession(client, userId);
    const notificationUpdatedByUserSecession =
      await notificationDB.deleteNotificationByUserSecession(client, userId);
    const reportUpdatedByUserSecession = await reportDB.deleteReportByUserSecession(client, userId);
    const reviewPostUpdatedByUserSecession = await reviewPostDB.deleteReviewPostByUserSecession(
      client,
      userId,
    );

    const dataUpdatedByUserSecession = {
      user: {
        id: userUpdatedByUserSecession.id,
        email: userUpdatedByUserSecession.email,
        updatedAt: userUpdatedByUserSecession.updatedAt,
        isDeleted: userUpdatedByUserSecession.isDeleted,
        deviceToken: userUpdatedByUserSecession.deviceToken,
        refreshToken: userUpdatedByUserSecession.refreshToken,
      },
      block: blockUpdatedByUserSecession,
      classroomPost: classroomPostUpdatedByUserSecession,
      Comment: commentUpdatedByUserSecession,
      like: likeUpdatedByUserSecession,
      notification: notificationUpdatedByUserSecession,
      report: reportUpdatedByUserSecession,
      reviewPost: reviewPostUpdatedByUserSecession,
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.DELETE_USER, dataUpdatedByUserSecession));
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
