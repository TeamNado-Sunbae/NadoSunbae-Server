const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { blockDB, userDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const userId = req.user.id;

  let client;

  try {
    client = await db.connect(req);

    const blockList = await blockDB.getBlockListByUserId(client, userId);

    const blockedUserList = await Promise.all(
      blockList.map(async (block) => {
        const blockedUser = await userDB.getUserByUserId(client, block.blockedUserId);
        return {
          userId: blockedUser.id,
          profileImageId: blockedUser.profileImageId,
          nickname: blockedUser.nickname,
        };
      }),
    );

    res
      .status(statusCode.OK)
      .send(
        util.success(
          statusCode.OK,
          responseMessage.READ_ALL_BLOCKED_USERS_SUCCESS,
          blockedUserList,
        ),
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
