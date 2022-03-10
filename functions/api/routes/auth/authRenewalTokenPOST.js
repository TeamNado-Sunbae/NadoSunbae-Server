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
    if (userData) {
      // accesstoken, refreshtoken 재발급
      const { accesstoken } = jwtHandlers.access(userData);

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

      // 알럿 메세지
      let message = "";

      // 후기글 미등록 유저
      if (!userData.isReviewed) {
        message = "후기 미등록자입니다.";
      }

      // 부적절 후기 등록 유저인지
      const inappropriateReviewPost =
        await inappropriateReviewPostDB.getInappropriateReviewPostByUser(client, userData.id);

      const isReviewInappropriate = inappropriateReviewPost ? true : false;

      // 부적절 후기글 등록 유저
      if (isReviewInappropriate) {
        message =
          "부적절한 후기 작성이 확인되어,\n열람 권한이 제한되었습니다.\n권한을 얻고 싶다면다시\n 학과후기를 작성해주세요.";
      }

      // 기본 userData로 초기화
      let updatedUserByExpiredReport = userData;

      // 신고로 인해 제재 중인 유저의 경우 - 신고 만료 확인
      if (userData.reportCreatedAt) {
        // 유저 신고 기간
        let reportPeriod;

        if (userData.reportCount === 1) {
          reportPeriod = reportPeriodType.FIRST_PERIOD;
        } else if (userData.reportCount === 2) {
          reportPeriod = reportPeriodType.SECOND_PERIOD;
        } else if (userData.reportCount === 3) {
          reportPeriod = reportPeriodType.THIRD_PERIOD;
        }

        // 신고 만료 날짜
        const expirationDate = dateHandlers.getExpirationDateByMonth(
          userData.reportCreatedAt,
          reportPeriod,
        );

        message = `신고 누적이용자로\n${expirationDate.format(
          "YYYY년 MM월 DD일",
        )}까지\n글 열람 및 작성이 불가능합니다.`;

        if (userData.reportCount >= 4) {
          message = `신고 누적으로\n글 열람 및 작성이\n영구적으로 제한됩니다.`;
        }

        // 한국 표준시 현재 날짜
        const today = dateHandlers.getCurrentKSTDate();

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

          // message는 빈 문자열로 변환
          message = "";
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
        /* 기존 로그인이랑 다른점
        이메일 인증 안된 경우 액세스 토큰 반환하지 않기 때문에
        자동 로그인은 이메일 인증 안된 유저일 가능성이 없음.
        따라서 늘 true로 반환한다.
        */
        isEmailVerified: true,
        isReviewed: userData.isReviewed,
        isUserReported: isUserReported,
        isReviewInappropriate: userData.isReviewInappropriate,
        message: message,
      };

      return res.status(statusCode.OK).send(
        util.success(
          statusCode.OK,
          `${responseMessage.UPDATE_TOKEN_SUCCESS} 또는 ${responseMessage.LOGIN_SUCCESS}`,
          {
            user,
            accesstoken,
            refreshtoken: userData.refreshToken,
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
