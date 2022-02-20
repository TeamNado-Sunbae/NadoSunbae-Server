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
  const { password } = req.body;
  const userId = req.user.id;
  const email = req.user.email;

  if (!password) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let deletedUser;

    // 로그인 및 firebase 계정 삭제
    const loginUser = await signInWithEmailAndPassword(firebaseAuth, email, password)
      .then(() => {
        deletedUser = deleteUser(firebaseAuth.currentUser)
          .then((user) => user)
          .catch((e) => {
            console.log(e);
            return { err: true };
          });
      })
      .catch((e) => {
        console.log(e);
        return { err: true };
      });

    if (loginUser.err) {
      if (loginUser.error.code === "auth/auth/wrong-password") {
        return res
          .status(statusCode.BAD_REQUEST)
          .json(util.fail(statusCode.BAD_REQUEST, responseMessage.MISS_MATCH_PW));
      } else {
        return res
          .status(statusCode.INTERNAL_SERVER_ERROR)
          .json(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
      }
    }

    if (deletedUser.err) {
      return res
        .status(statusCode.INTERNAL_SERVER_ERROR)
        .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.DELETE_USER_FAIL));
    }

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
        isDeleted: userUpdatedByUserSecession.isDeleted,
        updatedAt: userUpdatedByUserSecession.updatedAt,
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
