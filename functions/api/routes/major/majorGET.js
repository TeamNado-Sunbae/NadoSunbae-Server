const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { majorDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { majorId } = req.params;

  if (!majorId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    const majorData = await majorDB.getMajorByMajorId(client, majorId);
    if (!majorData) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_MAJOR));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ONE_MAJOR_SUCCESS, majorData));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
