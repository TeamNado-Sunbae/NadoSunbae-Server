const admin = require("firebase-admin");
const responseMessage = require("../constants/responseMessage");

const sendUnicast = function (token, notificationTitle, notificationContent) {
  // 메세지 내용
  const message = {
    notification: {
      title: notificationTitle,
      body: notificationContent,
    },
    android: {
      notification: {
        click_action: ".MainActivity",
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
      console.log(responseMessage.PUSH_ALARM_SEND_FAIL, error);
    });
};

const sendMulticast = function (tokens, notificationTitle, notificationContent) {
  // 알림을 전송할 사용자가 없어 tokens가 비어있으면 푸시알림을 전송하지 않음

  if (tokens.length !== 0) {
    // 메세지 내용
    const message = {
      notification: {
        title: notificationTitle,
        body: notificationContent,
      },
      android: {
        notification: {
          click_action: ".MainActivity",
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
      tokens: tokens,
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
              failedTokens.push(tokens[i]);
            }
          });
          console.log(responseMessage.PUSH_ALARM_SEND_FAIL, response.failureCount, failedTokens);
        }
      })
      .catch(function (error) {
        console.log(responseMessage.PUSH_ALARM_SEND_FAIL, error);
      });
  }
};

module.exports = {
  sendUnicast,
  sendMulticast,
};
