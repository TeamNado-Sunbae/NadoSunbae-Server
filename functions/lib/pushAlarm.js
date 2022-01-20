const admin = require("firebase-admin");

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
      console.log("Successfully send message:", response);
    })
    .catch(function (err) {
      console.log("Error Sending message:", err);
    });
};

exports.pushAlarms = async function (receiverTokens, alarmMessage, nickname) {
  let message = {
    notification: {
      title: "나도선배",
      body: alarmMessage + nickname + "님이 답글을 남겼습니다.",
    },
    token: receiverTokens,
  };

  admin
    .messaging()
    .sendMulticast(message)
    .then(function (response) {
      console.log("Successfully send message:", response);
    })
    .catch(function (err) {
      console.log("Error Sending message:", err);
    });
};
