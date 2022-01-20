const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, majorDB, reviewPostDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);
    let user = await userDB.getUserByUserId(client, userId);

    if (!user) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
    }

    const firstMajorName = await majorDB.getMajorNameByMajorId(client, user.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, user.secondMajorId);

    // 작성한 후기글 개수
    const reviewPostCount = await reviewPostDB.getReviewPostCountByUserId(client, user.id);

    user = {
      userId: user.id,
      profileImageId: user.profileImageId,
      nickname: user.nickname,
      firstMajorName: firstMajorName.majorName,
      firstMajorStart: user.firstMajorStart,
      secondMajorName: secondMajorName.majorName,
      secondMajorStart: user.secondMajorStart,
      isOnQuestion: user.isOnQuestion,
      reviewPostCount: reviewPostCount.count,
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ONE_USER_SUCCESS, user));
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
