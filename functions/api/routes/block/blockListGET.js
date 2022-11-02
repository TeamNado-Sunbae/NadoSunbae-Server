const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { blockDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const blockUserId = req.user.id;

  let client;

  try {
    client = await db.connect(req);

    const blockedUserList = await blockDB.getBlockedUserListByBlockUserId(client, blockUserId);

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
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
