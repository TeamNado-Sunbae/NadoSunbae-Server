const admin = require("firebase-admin");
const responseMessage = require("../constants/responseMessage");

const baseMessage = function (title, body) {
  return {
    notification: {
      title: title,
      body: body,
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
  };
};

const sendUnicast = function (token, notificationTitle, notificationContent) {
  const message = Object.assign(baseMessage(notificationTitle, notificationContent), {
    token: token,
  });

  // send message
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
  // prevent from sending to empty tokens
  if (tokens.length !== 0) {
    const message = Object.assign(baseMessage(notificationTitle, notificationContent), {
      tokens: tokens,
    });

    // send message
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
