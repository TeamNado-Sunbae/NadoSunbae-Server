const functions = require("firebase-functions");
const axios = require("axios");

const dotenv = require("dotenv");

dotenv.config();

// 슬랙 Webhook에서 발급받은 endpoint
const DEV_WEB_HOOK_ERROR_MONITORING = process.env.DEV_WEB_HOOK_ERROR_MONITORING;
const DEV_WEB_HOOK_USER_MONITORING = process.env.DEV_WEB_HOOK_USER_MONITORING;
const DEV_WEB_HOOK_DUMMY_MONITORING = process.env.DEV_WEB_HOOK_DUMMY_MONITORING;

const sendMessageToSlack = (message, apiEndPoint) => {
  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${process.env.NODE_ENV}*`.toUpperCase(),
        },
      },
      {
        type: "section",
        text: {
          type: "plain_text",
          text: message,
        },
      },
    ],
  };
  // send message to slack using slack webhook
  if (process.env.NODE_ENV !== "local") {
    try {
      axios
        .post(apiEndPoint, payload)
        .then((response) => {})
        .catch((e) => {
          throw e;
        });
    } catch (e) {
      console.error(e);
      // when slack webhook error occurs, logging error
      functions.logger.error("[slackAPI 에러]", { error: e });
    }
  }
};

module.exports = {
  sendMessageToSlack,
  DEV_WEB_HOOK_ERROR_MONITORING,
  DEV_WEB_HOOK_USER_MONITORING,
  DEV_WEB_HOOK_DUMMY_MONITORING,
};
