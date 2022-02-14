const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const { signInWithEmailAndPassword } = require("firebase/auth");
const db = require("../../../db/db");
const { userDB, majorDB, reportDB } = require("../../../db");

const { firebaseAuth } = require("../../../config/firebaseClient");
const jwtHandlers = require("../../../lib/jwtHandlers");
const reportPeriodType = require("../../../constants/reportPeriodType");

module.exports = async (req, res) => {
  const { email, password, deviceToken } = req.body;

  if (!email || !password || !deviceToken) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    const userFirebase = await signInWithEmailAndPassword(firebaseAuth, email, password)
      .then((user) => user)
      .catch((e) => {
        console.log(e);
        return { err: true, error: e };
      });

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

    const {
      user: { uid: firebaseId, emailVerified: isEmailVerified },
    } = userFirebase;
    // const firebaseId = userFirebase.user.uid;
    // const isEmailVerified = userFirebase.user.emailVerified; 와 동일

    const userData = await userDB.getUserByFirebaseId(client, firebaseId);
    const firstMajorName = await majorDB.getMajorNameByMajorId(client, userData.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, userData.secondMajorId);

    // 로그인시 토큰 새로 발급
    const { accesstoken } = jwtHandlers.access(userData);
    const { refreshtoken } = jwtHandlers.refresh();

    // refreshtoken 저장
    const updatedUserByRefreshToken = await userDB.updateUserByRefreshToken(
      client,
      userData.id,
      refreshtoken,
    );
    if (!updatedUserByRefreshToken) {
      return res
        .status(statusCode.INTERNAL_SERVER_ERROR)
        .send(
          util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.UPDATE_DEVICE_TOKEN_FAIL),
        );
    }

    // deviceToken 저장
    const updatedUserByDeviceToken = await userDB.updateUserByDeviceToken(
      client,
      userData.id,
      deviceToken,
    );
    if (!updatedUserByDeviceToken) {
      return res
        .status(statusCode.INTERNAL_SERVER_ERROR)
        .send(
          util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.UPDATE_DEVICE_TOKEN_FAIL),
        );
    }

    const today = new Date();
    // 기본 userData로 초기화
    let updatedUserByExpiredReport = userData;
    if (userData.reportCreatedAt) {
      // 신고기간 만료되었으면
      if (userData.reportCreatedAt.toLocaleString() <= today.toLocaleString()) {
        // 신고 테이블에서 유저에게 온 접수된 신고들을 만료시킴
        const deletedReportList = await reportDB.deleteReportList(client, userData.id);

        // 유저의 신고 시작 기간을 null로 초기화해줌
        updatedUserByExpiredReport = await userDB.updateUserByExpiredReport(
          client,
          userData.id,
          null,
        );
      }
    }

    // 유저 신고 여부, 신고 기간

    // 유저가 신고 당해 권한 제한된 상태인지
    let isUserReported;
    if (updatedUserByExpiredReport.reportCreatedAt) {
      isUserReported = true;
    } else {
      isUserReported = false;
    }

    // 유저 신고 기간
    let reportPeriod;
    if (isUserReported) {
      if (updatedUserByExpiredReport.reportCount === 1) {
        reportPeriod = reportPeriodType.FIRST_PERIOD;
      } else if (updatedUserByExpiredReport.reportCount === 2) {
        reportPeriod = reportPeriodType.SECOND_PERIOD;
      } else if (updatedUserByExpiredReport.reportCount === 3) {
        reportPeriod = reportPeriodType.THIRD_PERIOD;
      } else if (updatedUserByExpiredReport.reportCount > 3) {
        reportPeriod = reportPeriodType.FOURTH_PERIOD;
      }
    } else {
      reportPeriod = reportPeriodType.NO_PERIOD;
    }

    const user = {
      userId: userData.id,
      email: userData.email,
      universityId: userData.universityId,
      firstMajorId: userData.firstMajorId,
      firstMajorName: firstMajorName.majorName,
      secondMajorId: userData.secondMajorId,
      secondMajorName: secondMajorName.majorName,
      isReviewed: userData.isReviewed,
      isEmailVerified: isEmailVerified,
      isUserReported: isUserReported,
      reportPeriod: reportPeriod,
    };

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.LOGIN_SUCCESS, {
        user,
        accesstoken,
        refreshtoken,
      }),
    );
  } catch (error) {
    console.log(error);
    functions.logger.error(
      `[EMAIL LOGIN ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] email:${email} ${error}`,
    );

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
