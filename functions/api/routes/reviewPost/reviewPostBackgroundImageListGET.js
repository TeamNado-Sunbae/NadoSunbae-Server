const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { imageDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  let client;

  try {
    client = await db.connect(req);

    const backgroundImages = await imageDB.getReviewPostBackgroundImages(client);
    if (backgroundImages.length === 0) {
      return res.status(statusCode.NO_CONTENT).send(
        util.success(statusCode.NO_CONTENT, responseMessage.NO_CONTENT, {
          backgroundImageList: backgroundImages,
        }),
      );
    }

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_BACKGROUND_IMAGE_SUCCESS, {
        backgroundImageList: backgroundImages,
      }),
    );
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
