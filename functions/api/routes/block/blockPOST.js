const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { blockDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  // 차단 당한 유저 아이디
  const { blockedUserId } = req.body;
  // 차단한 유저 아이디
  const blockUserId = req.user.id;

  if (!blockedUserId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let existingBlockData = await blockDB.getBlockByuserId(client, blockUserId, blockedUserId);

    let blockData;

    if (!existingBlockData) {
      blockData = await blockDB.createBlock(client, blockUserId, blockedUserId);
    } else {
      blockData = await blockDB.updateBlockByUserId(client, blockUserId, blockedUserId);
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.BLOCK_SUCCESS, blockData));
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
