const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, userDB, notificationDB } = require("../../../db");
const notificationType = require("../../../constants/notificationType");
const postType = require("../../../constants/postType");
const slackAPI = require("../../../middlewares/slackAPI");
const pushAlarmHandlers = require("../../../lib/pushAlarmHandlers");

module.exports = async (req, res) => {
  const { majorId, answererId, postTypeId, title, content } = req.body;
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

  let client;

  try {
    client = await db.connect(req);
    let post = await classroomPostDB.createClassroomPost(
      client,
      majorId,
      req.user.id,
      answererId,
      postTypeId,
      title,
      content,
    );

    post = {
      postId: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      answererId: post.answererId,
      postTypeId: post.postTypeId,
    };

    const writer = {
      writerId: req.user.id,
      profileImageId: req.user.profileImageId,
      nickname: req.user.nickname,
      firstMajorName: req.user.firstMajorName,
      firstMajorStart: req.user.firstMajorStart,
      secondMajorName: req.user.secondMajorName,
      secondMajorStart: req.user.secondMajorStart,
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
      let sender = await userDB.getUserByUserId(client, req.user.id);
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
