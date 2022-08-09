const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { tagDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  let client;
  try {
    client = await db.connect(req);

    const tagList = await tagDB.getTagList(client);

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.READ_ALL_TAGS_SUCCESS, { tagList: tagList }),
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
