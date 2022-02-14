const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { commentDB, userDB, majorDB, classroomPostDB, notificationDB } = require("../../../db");
const notificationType = require("../../../constants/notificationType");
const postType = require("../../../constants/postType");
const admin = require("firebase-admin");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { postId, content } = req.body;

  if (!postId || !content) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);
    const commentWriterId = req.user.id;

    // 1대 1 질문글인 경우
    // 원글 작성자와 답변자만 댓글 등록 가능
    const postData = await classroomPostDB.getClassroomPostByPostId(client, postId);
    if (!postData) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }
    if (postData.postTypeId === 4) {
      if (postData.writerId !== commentWriterId && postData.answererId !== commentWriterId) {
        return res
          .status(statusCode.FORBIDDEN)
          .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
      }
    }

    // 댓글 등록
    let comment = await commentDB.createComment(client, postId, commentWriterId, content);

    // 댓글 작성자 정보 가져오기
    let writer = await userDB.getUserByUserId(client, commentWriterId);
    const firstMajorName = await majorDB.getMajorNameByMajorId(client, writer.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, writer.secondMajorId);

    writer = {
      writerId: writer.id,
      profileImageId: writer.profileImageId,
      nickname: writer.nickname,
      firstMajorName: firstMajorName.majorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: secondMajorName.majorName,
      secondMajorStart: writer.secondMajorStart,
    };

    comment = {
      commentId: comment.id,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt,
      isDeleted: comment.isDeleted,
      writer: writer,
    };

    // 푸시 알림 전송을 위한 case 설정
    // case 1은 마이페이지 관련

    // 푸시 알림 제목은 나도선배 통일
    const notificationTitle = "나도선배";

    // 댓글이 작성된 게시글
    const commentPost = await classroomPostDB.getClassroomPostByPostId(client, comment.postId);

    // [ case 2: 내가 쓴 글에 답글이 달린 경우 - 질문글 ]

    // receiver는 게시글 작성자, sender는 댓글 작성자
    let receiver = await userDB.getUserByUserId(client, commentPost.writerId);
    let sender = await userDB.getUserByUserId(client, comment.writer.writerId);
    let notificationContent = `작성하신 질문글에 ${sender.nickname}님이 답글을 남겼습니다.`;

    if (
      commentPost.postTypeId === postType.QUESTION_TO_EVERYONE ||
      commentPost.postTypeId === postType.QUESTION_TO_PERSON
    ) {
      if (receiver.id !== sender.id) {
        // DB에 알림 저장
        const notification = await notificationDB.createNotification(
          client,
          sender.id,
          receiver.id,
          comment.postId,
          notificationType.MY_QUESTION_COMMENT_ALARM,
          comment.content,
          comment.commentId,
          commentPost.postTypeId,
        );

        // 디바이스로 보낼 푸시 알림 메시지

        // 메세지 내용
        const message = {
          notification: {
            title: notificationTitle,
            body: notificationContent,
          },
          android: {
            notification: {
              sound: "default",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
          token: receiver.deviceToken,
        };

        // 메세지 전송
        admin
          .messaging()
          .send(message)
          .then(function (response) {
            console.log(responseMessage.PUSH_ALARM_SEND_SUCCESS, response);
          })
          .catch(function (error) {
            console.log(responseMessage.PUSH_ALARM_SEND_FAIL, error);
          });
      }
    }

    // [ case 3: 내가 쓴 글에 답글이 달린 경우 - 정보글 ]

    // receiver는 게시글 작성자, sender는 댓글 작성자
    receiver = await userDB.getUserByUserId(client, commentPost.writerId);
    sender = await userDB.getUserByUserId(client, comment.writer.writerId);
    notificationContent = `작성하신 정보글에 ${sender.nickname}님이 답글을 남겼습니다.`;

    if (commentPost.postTypeId === postType.INFORMATION) {
      if (receiver.id !== sender.id) {
        // DB에 알림 저장
        const notification = await notificationDB.createNotification(
          client,
          sender.id,
          receiver.id,
          comment.postId,
          notificationType.MY_INFORMATION_COMMENT_ALARM,
          comment.content,
          comment.commentId,
          commentPost.postTypeId,
        );

        // 디바이스로 보낼 푸시 알림 메시지

        // 메세지 내용
        const message = {
          notification: {
            title: notificationTitle,
            body: notificationContent,
          },
          android: {
            notification: {
              sound: "default",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
          token: receiver.deviceToken,
        };

        // 메세지 전송
        admin
          .messaging()
          .send(message)
          .then(function (response) {
            console.log(responseMessage.PUSH_ALARM_SEND_SUCCESS, response);
          })
          .catch(function (error) {
            console.log(responseMessage.PUSH_ALARM_SEND_FAIL, error);
          });
      }
    }

    // [ case 4: 내가 답글을 쓴 타인 글에 새 답글이 달린 경우 - 질문글 ]

    // 게시글에 달린 댓글 리스트
    let commentList = await commentDB.getCommentListByPostId(client, comment.postId);

    // 게시글에 달린 댓글 작성자들 아이디 리스트
    let commentWriterIdList = [];
    commentList.map((comment) => {
      commentWriterIdList.push(comment.writerId);
    });

    // 게시글에 달린 댓글 작성자들 아이디 리스트에서 중복된 작성자는 제거
    let set = new Set(commentWriterIdList);
    commentWriterIdList = [...set];

    // receiver는 게시글에 달린 댓글 작성자들, sender는 댓글 작성자
    let receivers = await userDB.getUsersByCommentWriterId(client, commentWriterIdList);
    sender = await userDB.getUserByUserId(client, comment.writer.writerId);
    notificationContent = `답글을 작성하신 질문글에 ${sender.nickname}님이 답글을 남겼습니다.`;

    if (
      commentPost.postTypeId === postType.QUESTION_TO_EVERYONE ||
      commentPost.postTypeId == postType.QUESTION_TO_PERSON
    ) {
      const receiverTokens = [];

      // DB에 알림 저장 및 receiverTokens 배열 값 저장
      await Promise.all(
        receivers.map(async (receiver) => {
          if (receiver.id !== sender.id && receiver.id !== commentPost.writerId) {
            const notification = await notificationDB.createNotification(
              client,
              sender.id,
              receiver.id,
              comment.postId,
              notificationType.OTHER_QUESTION_COMMENT_ALARM,
              comment.content,
              comment.commentId,
              commentPost.postTypeId,
            );
            receiverTokens.push(receiver.deviceToken);
          }
        }),
      );

      // 디바이스로 보낼 푸시 알림 메시지

      // 댓글 리스트에 있는 유저들의 디바이스 토큰 정보 저장
      // 댓글이 있을 때만 푸시알림 전송, 댓글이 없을 경우 tokens가 빈 배열이라서 오류남.

      if (receiverTokens.length !== 0) {
        // 메세지 내용
        const message = {
          notification: {
            title: notificationTitle,
            body: notificationContent,
          },
          android: {
            notification: {
              sound: "default",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
          tokens: receiverTokens,
        };
        // 메세지 전송
        admin
          .messaging()
          .sendMulticast(message)
          .then((response) => {
            console.log(responseMessage.PUSH_ALARM_SEND_SUCCESS, response.successCount);
            if (response.failureCount > 0) {
              const failedTokens = [];
              response.responses.forEach((response, i) => {
                if (!response.success) {
                  failedTokens.push(receiverTokens[i]);
                }
              });
              console.log(
                responseMessage.PUSH_ALARM_SEND_FAIL,
                response.failureCount,
                failedTokens,
              );
            }
          })
          .catch(function (error) {
            console.log(responseMessage.PUSH_ALARM_SEND_FAIL, error);
          });
      }
    }

    // [ case 5: 내가 답글을 쓴 타인 글에 새 답글이 달린 경우 - 정보글 ]

    // 게시글에 달린 댓글 리스트
    commentList = await commentDB.getCommentListByPostId(client, comment.postId);

    // 게시글에 달린 댓글 작성자들 아이디 리스트
    commentWriterIdList = [];
    commentList.map((comment) => {
      commentWriterIdList.push(comment.writerId);
    });

    // 게시글에 달린 댓글 작성자들 아이디 리스트에서 중복된 작성자는 제거
    set = new Set(commentWriterIdList);
    commentWriterIdList = [...set];

    // receiver는 게시글에 달린 댓글 작성자들, sender는 댓글 작성자
    receivers = await userDB.getUsersByCommentWriterId(client, commentWriterIdList);
    sender = await userDB.getUserByUserId(client, comment.writer.writerId);
    notificationContent = `답글을 작성하신 정보글에 ${sender.nickname}님이 답글을 남겼습니다.`;

    if (commentPost.postTypeId === postType.INFORMATION) {
      const receiverTokens = [];

      // DB에 알림 저장 및 receiverTokens 배열 값 저장
      await Promise.all(
        receivers.map(async (receiver) => {
          if (receiver.id !== sender.id && receiver.id !== commentPost.writerId) {
            const notification = await notificationDB.createNotification(
              client,
              sender.id,
              receiver.id,
              comment.postId,
              notificationType.OTHER_INFORMATION_COMMENT_ALARM,
              comment.content,
              comment.commentId,
              commentPost.postTypeId,
            );
            receiverTokens.push(receiver.deviceToken);
          }
        }),
      );

      // 디바이스로 보낼 푸시 알림 메시지

      // 댓글 리스트에 있는 유저들의 디바이스 토큰 정보 저장
      // 댓글이 있을 때만 푸시알림 전송, 댓글이 없을 경우 tokens가 빈 배열이라서 오류남.

      if (receiverTokens.length !== 0) {
        // 메세지 내용
        const message = {
          notification: {
            title: notificationTitle,
            body: notificationContent,
          },
          android: {
            notification: {
              sound: "default",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
          tokens: receiverTokens,
        };

        // 메세지 전송
        admin
          .messaging()
          .sendMulticast(message)
          .then((response) => {
            console.log(responseMessage.PUSH_ALARM_SEND_SUCCESS, response.successCount);
            if (response.failureCount > 0) {
              const failedTokens = [];
              response.responses.forEach((response, i) => {
                if (!response.success) {
                  failedTokens.push(receiverTokens[i]);
                }
              });
              console.log(
                responseMessage.PUSH_ALARM_SEND_FAIL,
                response.failureCount,
                failedTokens,
              );
            }
          })
          .catch(function (error) {
            console.log(responseMessage.PUSH_ALARM_SEND_FAIL, error);
          });
      }
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.CREATE_ONE_COMMENT_SUCCESS, comment));
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
