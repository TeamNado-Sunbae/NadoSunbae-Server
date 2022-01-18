const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, majorDB } = require("../../../db");

module.exports = async (req, res) => {
  let user = req.user;
  let client;

  try {
    client = await db.connect(req);

    const userData = await userDB.getUserByUserId(client, user.id);
    const firstMajorName = await majorDB.getMajorNameByMajorId(client, userData.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, userData.secondMajorId);
    user = {
      userId: userData.id,
      email: userData.email,
      universityId: userData.universityId,
      firstMajorId: userData.firstMajorId,
      firstMajorName: firstMajorName.majorName,
      secondMajorId: userData.secondMajorId,
      secondMajorName: secondMajorName.majorName,
      isReviewed: userData.isReviewed,
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.LOGIN_SUCCESS, user));
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
