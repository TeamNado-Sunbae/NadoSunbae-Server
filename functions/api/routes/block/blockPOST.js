const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { blockDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

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

    const existingBlockData = await blockDB.getBlockByUserId(client, blockUserId, blockedUserId);

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
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
