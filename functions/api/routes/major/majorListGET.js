const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { majorDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { universityId } = req.params;
  const { filter } = req.query;

  if (!universityId || !filter) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let majorList;

    if (filter === "all") {
      majorList = await majorDB.getMajorListByUniversityId(
        client,
        universityId,
        [true, false],
        [true, false],
      );
    } else if (filter === "firstMajor") {
      majorList = await majorDB.getMajorListByUniversityId(
        client,
        universityId,
        [true],
        [true, false],
      );
    } else if (filter === "secondMajor") {
      majorList = await majorDB.getMajorListByUniversityId(
        client,
        universityId,
        [true, false],
        [true],
      );
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_FILTER));
    }

    if (!majorList) {
      return res
        .status(statusCode.NO_CONTENT)
        .send(util.success(statusCode.NO_CONTENT, responseMessage.NO_CONTENT, majorList));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_MAJORS_SUCCESS, majorList));
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
