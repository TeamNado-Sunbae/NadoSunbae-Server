const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, userDB, notificationDB, majorDB } = require("../../../db");
const { postType, notificationType } = require("../../../constants/type");
const pushAlarmHandlers = require("../../../lib/pushAlarmHandlers");
const errorHandlers = require("../../../lib/errorHandlers");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { majorId, answererId, type, title, content } = req.body;
  if (!majorId || !type || !title || !content) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let postTypeId;
    if (type === "information") {
      postTypeId = postType.INFORMATION;
    } else if (type === "questionToEveryone") {
      postTypeId = postType.QUESTION_TO_EVERYONE;
    } else if (type === "questionToPerson") {
      if (!answererId) {
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
      }
      postTypeId = postType.QUESTION_TO_PERSON;
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_TYPE));
    }

    let post = await postDB.createPost(
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
      .status(statusCode.CREATED)
      .send(
        util.success(statusCode.CREATED, responseMessage.CREATE_ONE_POST_SUCCESS, { post, writer }),
      );

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

    // 더미 데이터에 1:1 질문 들어왔을 경우 슬랙에 메세지 전송
    if (answererId >= 1 && answererId <= 63) {
      const answerer = await userDB.getUserByUserId(client, answererId);
      const major = await majorDB.getMajorByMajorId(client, majorId);
      const slackMessage = `[NEW QUESTION]\n answererId: ${answererId}\n nickname: ${answerer.nickname}\n major: ${major.majorName}\n title: ${title}\n content: ${content} `;
      slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_DUMMY_MONITORING);
    }
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
