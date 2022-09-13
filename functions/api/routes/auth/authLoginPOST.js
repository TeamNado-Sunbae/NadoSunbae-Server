const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, reportDB, inappropriateReviewDB } = require("../../../db");
const { firebaseAuth } = require("../../../config/firebaseClient");
const { signInWithEmailAndPassword } = require("firebase/auth");
const jwtHandlers = require("../../../lib/jwtHandlers");
const dateHandlers = require("../../../lib/dateHandlers");
const errorHandlers = require("../../../lib/errorHandlers");
const reportPeriod = require("../../../constants/reportPeriod");

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

    const userData = await userDB.getUserByFirebaseId(client, firebaseId);
    if (!userData) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
    }

    if (!isEmailVerified) {
      return res.status(statusCode.ACCEPTED).send(
        util.success(statusCode.ACCEPTED, responseMessage.IS_NOT_EMAIL_VERIFICATION, {
          userId: userData.id,
          isEmailVerified: isEmailVerified,
        }),
      );
    }

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
          util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.UPDATE_REFRESH_TOKEN_FAIL),
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

    // 알럿 메세지
    let message = "";

    // 후기글 미등록 유저
    if (!userData.isReviewed) {
      message = "후기 미등록자입니다.";
    }

    // 부적절 후기 등록 유저인지
    const inappropriateReview = await inappropriateReviewDB.getInappropriateReviewByUser(
      client,
      userData.id,
    );

    const isReviewInappropriate = inappropriateReview ? true : false;

    // 부적절 후기글 등록 유저
    if (isReviewInappropriate) {
      message =
        "부적절한 후기 작성이 확인되어,\n열람 권한이 제한되었습니다.\n권한을 얻고 싶다면\n다시 학과후기를 작성해주세요.";
    }

    // 기본 userData로 초기화
    let updatedUserByExpiredReport = userData;

    // 신고로 인해 제재 중인 유저의 경우 - 신고 만료 확인
    if (userData.reportCreatedAt) {
      // 유저 신고 기간
      let period;

      if (userData.reportCount === 1) {
        period = reportPeriod.FIRST_PERIOD;
      } else if (userData.reportCount === 2) {
        period = reportPeriod.SECOND_PERIOD;
      } else if (userData.reportCount === 3) {
        period = reportPeriod.THIRD_PERIOD;
      }

      // 신고 만료 날짜
      const expirationDate = dateHandlers.getExpirationDateByMonth(
        userData.reportCreatedAt,
        period,
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
      isEmailVerified: isEmailVerified,
      isReviewed: userData.isReviewed,
      isUserReported: isUserReported,
      isReviewInappropriate: isReviewInappropriate,
      message: message,
    };

    // 앱 업데이트 규모에 따른 알럿 문구
    const updateAlert = {
      minor: "유저들의 의견을 반영하여\n사용성을 개선했어요.\n지금 바로 업데이트해보세요!",
      major: "안정적인 서비스 사용을 위해\n최신 버전으로 업데이트해주세요.",
    };

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.LOGIN_SUCCESS, {
        user,
        accesstoken,
        refreshtoken,
        updateAlert,
      }),
    );
  } catch (error) {
    errorHandlers.error(req, error, `email:${email}`);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
