const functions = require("firebase-functions");
const slackAPI = require("../../../middlewares/slackAPI");

const log = (req, error, payload) => {
  const title = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`;
  let content = `[CONTENT] ${error}`;
  if (payload) {
    content += payload;
  }

  functions.logger.error(title, content);
  console.log(error);
};

const sendSlack = (req, error, payload) => {
  const title = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`;
  let content = `${error} ${JSON.stringify(error)}`;
  if (payload) {
    content += payload;
  }

  const message = title + "\n" + content;
  slackAPI.sendMessageToSlack(message, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
};

const error = (req, error, payload) => {
  log(req, error, payload);
  sendSlack(req, error, payload);
};

module.exports = {
  error,
};
