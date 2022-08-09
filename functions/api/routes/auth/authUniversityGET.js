const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { universityDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { universityId } = req.params;

  if (!universityId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    const universityData = await universityDB.getEmailByUniversityId(client, universityId);
    if (!universityData) {
      return res
        .status(statusCode.NO_CONTENT)
        .send(util.success(statusCode.NO_CONTENT, responseMessage.NO_CONTENT, universityData));
    }

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.READ_UNIVERSITY_EMAIL_SUCCESS, universityData),
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
