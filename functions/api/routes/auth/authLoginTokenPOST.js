const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, reportDB, inappropriateReviewPostDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const jwtHandlers = require("../../../lib/jwtHandlers");
const dateHandlers = require("../../../lib/dateHandlers");
const reportPeriodType = require("../../../constants/reportPeriodType");

module.exports = async (req, res) => {
  // accesstoken은 auth middleware에서 null 및 유효성 체크
  const userData = req.user;

  let client;
  try {
    client = await db.connect(req);

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

    // 기본 userData로 초기화
    let updatedUserByExpiredReport = userData;

    // 신고로 인해 제재 중인 유저의 경우 - 신고 만료 확인
    if (userData.reportCreatedAt) {
      // 한국 표준시 현재 날짜
      const today = dateHandlers.getCurrentKSTDate();

      // 신고 접수된 날짜 - 기준 날짜
      const reportCreatedDate = userData.reportCreatedAt;

      // 유저 신고 기간
      let reportPeriod;

      if (userData.reportCount === 1) {
        reportPeriod = reportPeriodType.FIRST_PERIOD;
      } else if (userData.reportCount === 2) {
        reportPeriod = reportPeriodType.SECOND_PERIOD;
      } else if (userData.reportCount === 3) {
        reportPeriod = reportPeriodType.THIRD_PERIOD;
      }

      const expirationDate = dateHandlers.getExpirationDateByMonth(reportCreatedDate, reportPeriod);

      // 신고 만료 날짜 지났으면
      if (expirationDate.format("YYYY.MM.DD HH:mm:ss") < today.format("YYYY.MM.DD HH:mm:ss")) {
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

    // 유저가 신고 당해 권한 제한된 상태인지
    const isUserReported = updatedUserByExpiredReport.reportCreatedAt ? true : false;

    const user = {
      userId: userData.id,
      email: userData.email,
      universityId: userData.universityId,
      firstMajorId: userData.firstMajorId,
      firstMajorName: userData.firstMajorName,
      secondMajorId: userData.secondMajorId,
      secondMajorName: userData.secondMajorName,
      isReviewed: userData.isReviewed,
      /* 기존 로그인이랑 다른점
        이메일 인증 안된 경우 액세스 토큰 반환하지 않기 때문에
        자동 로그인은 이메일 인증 안된 유저일 가능성이 없음.
        따라서 늘 true로 반환한다.
        */
      isEmailVerified: true,
      isUserReported: isUserReported,
      isReviewInappropriate: userData.isReviewInappropriate,
    };

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.LOGIN_SUCCESS, {
        user,
        accesstoken,
        refreshtoken,
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
