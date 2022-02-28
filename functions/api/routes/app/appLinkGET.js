const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const appVersion = require("../../../constants/appVersion");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  try {
    const linkList = {
      personalInformationPolicy:
        "https://www.notion.so/nadosunbae/V-1-0-2022-3-1-e4637880bb1d4a6e8938f4f0c306b2d5",
      termsOfService:
        "https://www.notion.so/nadosunbae/V-1-0-2022-3-1-d1d15e411b0b417198b2405468894dea",
      openSourceLicense: "https://www.notion.so/nadosunbae/V-1-0-2442b1af796041d09bc6e8729c172438",
      kakaoTalkChannel: "http://pf.kakao.com/_pxcFib",
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_APP_INFORMATION_LINK, linkList));
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
  }
};
