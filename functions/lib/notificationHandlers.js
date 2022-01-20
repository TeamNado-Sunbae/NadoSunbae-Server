const admin = require("firebase-admin");
const responseMessage = require("../constants/responseMessage");

const sendUnicast = function (token, notificationTitle, notificationContent) {
  // 메세지 내용
  const message = {
    notification: {
      title: notificationTitle,
      body: notificationContent,
    },
    token: token,
  };

  // 메세지 전송
  admin
    .messaging()
    .send(message)
    .then(function (response) {
      console.log(responseMessage.PUSH_ALARM_SEND_SUCCESS, response);
    })
    .catch(function (error) {
      console.log(responseMessage.PUSH_ALARM_SEND_FAIL);
    });
};

const sendMulticast = function (tokens, notificationTitle, notificationContent) {
  // 댓글이 있을 때만 푸시알림 전송, 댓글이 없을 경우 tokens가 빈 배열이라서 오류남.

  if (tokens.length !== 0) {
    // 메세지 내용
    const message = {
      notification: {
        title: notificationTitle,
        body: notificationContent,
      },
      tokens: tokens,
    };

    // 메세지 전송
    admin
      .messaging()
      .sendMulticast(message)
      .then((response) => {
        console.log(responseMessage.PUSH_ALARM_SEND_SUCCESS, response.successCount);
      })
      .catch(function (error) {
        console.log(responseMessage.PUSH_ALARM_SEND_FAIL);
      });
  }
};

module.exports = {
  sendUnicast,
  sendMulticast,
};
