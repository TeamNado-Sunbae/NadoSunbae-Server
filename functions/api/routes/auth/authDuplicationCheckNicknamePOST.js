const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { nickname } = req.body;

  if (!nickname) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);
    const user = await userDB.getUserByNickname(client, nickname);
    if (user) {
      return res
        .status(statusCode.CONFLICT)
        .send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_NICKNAME));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.AVAILABLE_NICKNAME, nickname));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
