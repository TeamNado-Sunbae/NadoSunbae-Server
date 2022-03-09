const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const { signInWithEmailAndPassword } = require("firebase/auth");
const db = require("../../../db/db");
const { userDB, reportDB, inappropriateReviewPostDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const { firebaseAuth } = require("../../../config/firebaseClient");
const jwtHandlers = require("../../../lib/jwtHandlers");
const dateHandlers = require("../../../lib/dateHandlers");
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

    let {
      user: { uid: firebaseId, emailVerified: isEmailVerified },
    } = userFirebase;
    // const firebaseId = userFirebase.user.uid;
    // const isEmailVerified = userFirebase.user.emailVerified; 와 동일

    const userData = await userDB.getUserByFirebaseId(client, firebaseId);
    if (!userData) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
    }

    const testUserIdList = [];

    for (let i = 1; i < 440; i++) {
      testUserIdList.push(i);
    }
    console.log(testUserIdList);

    if (testUserIdList.indexOf(userData.id) === -1) {
      if (!isEmailVerified) {
        return res.status(statusCode.ACCEPTED).send(
          util.success(statusCode.ACCEPTED, responseMessage.IS_NOT_EMAIL_VERIFICATION, {
            userId: userData.id,
            isEmailVerified: isEmailVerified,
          }),
        );
      }
    }

    if (testUserIdList.indexOf(userData.id) > -1) {
      isEmailVerified = true;
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

    // 알럿 메세지
    let message = "";

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

    // 부적절 후기 등록 유저인지
    const inappropriateReviewPost =
      await inappropriateReviewPostDB.getInappropriateReviewPostByUser(client, userData.id);

    const isReviewInappropriate = inappropriateReviewPost ? true : false;

    // 부적절 후기글 등록 유저
    if (isReviewInappropriate) {
      message =
        "부적절한 후기 작성이 확인되어,\n열람 권한이 제한되었습니다.\n권한을 얻고 싶다면다시\n 학과후기를 작성해주세요.";
    }

    // 후기글 미등록 유저
    if (!userData.isReviewed) {
      message = "후기 미등록자입니다.";
    }

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
