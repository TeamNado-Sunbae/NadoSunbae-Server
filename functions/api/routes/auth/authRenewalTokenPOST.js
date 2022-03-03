const functions = require("firebase-functions");
const jwtHandlers = require("../../../lib/jwtHandlers");
const db = require("../../../db/db");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const { userDB, reportDB, inappropriateReviewPostDB } = require("../../../db");
const { TOKEN_INVALID, TOKEN_EXPIRED } = require("../../../constants/jwt");
const dateHandlers = require("../../../lib/dateHandlers");
const reportPeriodType = require("../../../constants/reportPeriodType");

module.exports = async (req, res) => {
  const { refreshtoken } = req.headers;

  // refreshtoken 없을 시
  if (!refreshtoken)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.TOKEN_EMPTY));

  let client;
  try {
    client = await db.connect(req);

    // token 해독
    let decodedRefreshtoken = jwtHandlers.verify(refreshtoken);

    // 올바르지 않는 토큰 (만료와 상관없음)
    if (decodedRefreshtoken == TOKEN_INVALID) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_INVALID));
    }

    // 토큰 만료 확인 및 재발급
    // refresh token 만료 (재로그인 필요)
    if (decodedRefreshtoken === TOKEN_EXPIRED) {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_EXPIRED));
    }

    // access token만 만료
    const userData = await userDB.getUserByRefreshToken(client, refreshtoken);
    if (userData.id) {
      // accesstoken, refreshtoken 재발급
      const { accesstoken } = jwtHandlers.access(userData);
      const { refreshtoken } = jwtHandlers.refresh();

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

        const expirationDate = dateHandlers.getExpirationDateByMonth(
          reportCreatedDate,
          reportPeriod,
        );

        // 신고 만료 날짜 지났으면
        if (expirationDate.format("YYYY.MM.DD HH:mm:ss") < today.format("YYYY.MM.DD HH:mm:ss")) {
          // 신고 테이블에서 유저에게 온 접수된 신고들을 만료시킴
          await reportDB.deleteReportList(client, userData.id);

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

      // 부적절 후기 등록 유저인지
      const inappropriateReviewPost =
        await inappropriateReviewPostDB.getInappropriateReviewPostByUser(client, userData.id);

      userData.isReviewInappropriate = inappropriateReviewPost ? true : false;

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

      return res.status(statusCode.OK).send(
        util.success(
          statusCode.OK,
          `${responseMessage.UPDATE_TOKEN_SUCCESS} 또는 ${responseMessage.LOGIN_SUCCESS}`,
          {
            user,
            accesstoken,
            refreshtoken,
          },
        ),
      );
    } else {
      return res
        .status(statusCode.UNAUTHORIZED)
        .send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_INVALID));
    }
  } catch (error) {
    console.log(error);
    functions.logger.error(
      `[AUTH ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      refreshtoken,
    );
    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
