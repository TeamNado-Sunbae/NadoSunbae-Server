const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB } = require("../../../db");

module.exports = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);
    const user = await userDB.getUserByEmail(client, email);
    if (user) {
      return res
        .status(statusCode.CONFLICT)
        .send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_EMAIL));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.AVAILABLE_MAIL, email));
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
