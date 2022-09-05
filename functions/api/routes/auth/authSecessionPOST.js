const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const { firebaseAuth } = require("../../../config/firebaseClient");
const { signInWithEmailAndPassword, deleteUser } = require("firebase/auth");
const db = require("../../../db/db");
const {
  userDB,
  blockDB,
  postDB,
  commentDB,
  likeDB,
  notificationDB,
  reportDB,
  reviewDB,
} = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

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

    // 로그인 및 firebase 계정 삭제
    const loginUser = await signInWithEmailAndPassword(firebaseAuth, email, password)
      .then((user) => user)
      .catch((e) => {
        console.log(e);
        return { err: true, error: e };
      });

    if (loginUser.err) {
      if (loginUser.error.code === "auth/wrong-password") {
        return res
          .status(statusCode.UNAUTHORIZED)
          .json(util.fail(statusCode.UNAUTHORIZED, responseMessage.MISS_MATCH_PW));
      } else {
        return res
          .status(statusCode.INTERNAL_SERVER_ERROR)
          .json(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.DELETE_USER_FAIL));
      }
    }

    const deletedUser = await deleteUser(loginUser.user)
      .then(() => {
        console.log("firebase 계정 삭제 성공");
        return { err: false };
      })
      .catch((e) => {
        console.log(e);
        return { err: true };
      });

    if (deletedUser.err) {
      return res
        .status(statusCode.INTERNAL_SERVER_ERROR)
        .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.DELETE_USER_FAIL));
    }

    // DB에서 유저 관련 정보 모두 삭제
    const userUpdatedByUserSecession = await userDB.deleteUserByUserSecession(client, userId);
    const blockUpdatedByUserSecession = await blockDB.deleteBlockListByUserSecession(
      client,
      userId,
    );
    const postUpdatedByUserSecession = await postDB.deletePostListByUserSecession(client, userId);
    const commentUpdatedByUserSecession = await commentDB.deleteCommentListByUserSecession(
      client,
      userId,
    );
    const likeUpdatedByUserSecession = await likeDB.deleteLikeListByUserSecession(client, userId);
    const notificationUpdatedByUserSecession =
      await notificationDB.deleteNotificationListByUserSecession(client, userId);
    const reportUpdatedByUserSecession = await reportDB.deleteReportListByUserSecession(
      client,
      userId,
    );
    const reviewUpdatedByUserSecession = await reviewDB.deleteReviewListByUserSecession(
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
      post: postUpdatedByUserSecession,
      comment: commentUpdatedByUserSecession,
      like: likeUpdatedByUserSecession,
      notification: notificationUpdatedByUserSecession,
      report: reportUpdatedByUserSecession,
      review: reviewUpdatedByUserSecession,
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.DELETE_USER, dataUpdatedByUserSecession));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
