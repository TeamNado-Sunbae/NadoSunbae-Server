const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, userDB, notificationDB, majorDB, blockDB } = require("../../../db");
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

    const post = await postDB.createPost(
      client,
      majorId,
      req.user.id,
      answererId,
      postTypeId,
      title,
      content,
    );

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.CREATE_ONE_POST_SUCCESS, {
        post: {
          postId: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          answererId: post.answererId,
          postTypeId: post.postTypeId,
        },
        writer: {
          writerId: req.user.id,
          profileImageId: req.user.profileImageId,
          nickname: req.user.nickname,
          firstMajorName: req.user.firstMajorName,
          firstMajorStart: req.user.firstMajorStart,
          secondMajorName: req.user.secondMajorName,
          secondMajorStart: req.user.secondMajorStart,
        },
      }),
    );

    // ******************************************************************************************
    // notification DB 저장 및 푸시 알림 전송

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    const notificationTitle = "나도선배";
    const sender = await userDB.getUserByUserId(client, req.user.id);

    let receiver, unicastNotificationTypeId, unicastNotificationContent;
    let receivers, multicastNotificationTypeId, multicastNotificationContent;

    if (post.postTypeId === postType.QUESTION_TO_PERSON && post.answererId) {
      receiver = await userDB.getUserByUserId(client, post.answererId);
      unicastNotificationTypeId = notificationType.QUESTION_TO_PERSON_ALARM;
      unicastNotificationContent = `마이페이지에 ${sender.nickname}님이 1:1 질문을 남겼습니다.`;
    } else if (post.postTypeId === postType.QUESTION_TO_EVERYONE) {
      const major = await majorDB.getMajorByMajorId(client, post.majorId);
      receivers = await userDB.getUserListByMajorId(
        client,
        post.majorId,
        [true, false],
        invisibleUserIds,
      );
      multicastNotificationTypeId = notificationType.COMMUNITY_ALARM;
      multicastNotificationContent = `커뮤니티에 ${major.majorName} 질문글이 올라왔습니다.`;
    }

    // for unicast
    if (receiver && receiver.id !== sender.id) {
      notificationDB.createNotification(
        client,
        sender.id,
        receiver.id,
        post.id,
        unicastNotificationTypeId,
        post.title,
        null,
        post.postTypeId,
      );

      // 푸시 알림 전송
      if (receiver.deviceToken) {
        pushAlarmHandlers.sendUnicast(
          receiver.deviceToken,
          notificationTitle,
          unicastNotificationContent,
        );
      }
    }

    // for multicast
    if (receivers) {
      const receiverTokens = [];
      receivers.map((receiver) => {
        if (receiver.id !== sender.id) {
          notificationDB.createNotification(
            client,
            sender.id,
            receiver.id,
            post.id,
            multicastNotificationTypeId,
            post.title,
            null,
            post.postTypeId,
          );

          if (receiver.deviceToken) {
            receiverTokens.push(receiver.deviceToken);
          }
        }
      });

      // 푸시 알림 전송
      pushAlarmHandlers.sendMulticast(
        receiverTokens,
        notificationTitle,
        multicastNotificationContent,
      );
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
