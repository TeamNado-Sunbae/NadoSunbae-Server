const admin = require("firebase-admin");
const responseMessage = require("../constants/responseMessage");

exports.pushAlarm = async function (deviceToken, alarmMessage, nickname) {
  let message = {
    notification: {
      title: "나도선배",
      body: alarmMessage + nickname + "님이 답글을 남겼습니다.",
    },
    token: deviceToken,
  };

  admin
    .messaging()
    .send(message)
    .then(function (response) {
      console.log(responseMessage.PUSH_ALARM_SEND_SUCCESS, response);
    })
    .catch(function (err) {
      console.log(responseMessage.PUSH_ALARM_SEND_FAIL, err);
    });
};

exports.pushAlarms = async function (receiverTokens, alarmMessage, nickname) {
  let message = {
    notification: {
      title: "나도선배",
      body: alarmMessage + nickname + "님이 답글을 남겼습니다.",
    },
    tokens: receiverTokens,
  };

  admin
    .messaging()
    .sendMulticast(message)
    .then(function (response) {
      console.log(responseMessage.PUSH_ALARM_SEND_SUCCESS, response);
    })
    .catch(function (err) {
      console.log(responseMessage.PUSH_ALARM_SEND_FAIL, err);
    });
};
