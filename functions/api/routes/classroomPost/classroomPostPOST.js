const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, majorDB, userDB, notificationDB } = require("../../../db");
const notificationType = require("../../../constants/notificationType");
const postType = require("../../../constants/postType");
const slackAPI = require("../../../middlewares/slackAPI");
const pushAlarmHandlers = require("../../../lib/pushAlarmHandlers");
const dateHandlers = require("../../../lib/dateHandlers");
const reportPeriodType = require("../../../constants/reportPeriodType");

module.exports = async (req, res) => {
  const { majorId, answererId, postTypeId, title, content } = req.body;
  let writer = req.user;

  if (!majorId || !postTypeId || !title || !content) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  if (postTypeId === postType.QUESTION_TO_PERSON) {
    if (!answererId) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
    }
  }

  // 신고당한 유저
  if (req.user.reportCreatedAt) {
    // 유저 신고 기간
    let reportPeriod;

    // 알럿 메세지
    let reportResponseMessage;

    if (req.user.reportCount === 1) {
      reportPeriod = reportPeriodType.FIRST_PERIOD;
    } else if (req.user.reportCount === 2) {
      reportPeriod = reportPeriodType.SECOND_PERIOD;
    } else if (req.user.reportCount === 3) {
      reportPeriod = reportPeriodType.THIRD_PERIOD;
    } else if (req.user.reportCount >= 4) {
      reportResponseMessage = `신고 누적으로 글 열람 및 작성이 영구적으로 제한됩니다.`;
    }

    // 신고 만료 날짜
    const expirationDate = dateHandlers.getExpirationDateByMonth(
      req.user.reportCreatedAt,
      reportPeriod,
    );

    reportResponseMessage = `신고 누적이용자로 ${expirationDate.format(
      "YYYY년 MM월 DD일",
    )}까지 글 열람 및 작성이 불가능합니다.`;

    return res
      .status(statusCode.FORBIDDEN)
      .send(util.fail(statusCode.FORBIDDEN, reportResponseMessage));
  }

  // 부적절 후기글 등록 유저
  if (req.user.isReviewInappropriate === true) {
    return res
      .status(statusCode.FORBIDDEN)
      .send(
        util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS_INAPPROPRIATE_REVIEW_POST),
      );
  }

  // 후기글 미등록 유저
  if (writer.isReviewed === false) {
    return res
      .status(statusCode.FORBIDDEN)
      .send(util.fail(statusCode.FORBIDDEN, responseMessage.IS_REVIEWED_FALSE));
  }

  let client;

  try {
    client = await db.connect(req);
    let post = await classroomPostDB.createClassroomPost(
      client,
      majorId,
      writer.id,
      answererId,
      postTypeId,
      title,
      content,
    );

    const firstMajorName = await majorDB.getMajorNameByMajorId(client, writer.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, writer.secondMajorId);

    post = {
      postId: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      answererId: post.answererId,
      postTypeId: post.postTypeId,
    };

    writer = {
      writerId: writer.id,
      profileImageId: writer.profileImageId,
      nickname: writer.nickname,
      firstMajorName: firstMajorName.majorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: secondMajorName.majorName,
      secondMajorStart: writer.secondMajorStart,
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.CREATE_ONE_POST_SUCCESS, { post, writer }));

    // notification DB 저장 및 푸시 알림 전송을 위한 case 설정
    // [ case 1: 마이페이지에 1:1 질문글이 올라온 경우 ]

    // 1:1 질문글인 경우에만 알림 전송
    if (post.postTypeId === postType.QUESTION_TO_PERSON && post.answererId) {
      // 푸시 알림 제목은 나도선배 통일
      const notificationTitle = "나도선배";

      // receiver는 게시글의 answerer, sender는 게시글 작성자
      let receiver = await userDB.getUserByUserId(client, post.answererId);
      let sender = await userDB.getUserByUserId(client, writer.writerId);
      let notificationContent = `마이페이지에 ${sender.nickname}님이 1:1 질문을 남겼습니다.`;

      if (receiver.id !== sender.id) {
        // DB에 알림 저장
        const notification = await notificationDB.createNotification(
          client,
          sender.id,
          receiver.id,
          post.postId,
          notificationType.QUESTION_TO_PERSON_ALARM,
          post.title,
          null,
          post.postTypeId,
        );

        // 푸시 알림 전송
        if (receiver.deviceToken) {
          pushAlarmHandlers.sendUnicast(
            receiver.deviceToken,
            notificationTitle,
            notificationContent,
          );
        }
      }
    }
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
