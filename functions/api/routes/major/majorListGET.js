const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { majorDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

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
      majorList.shift();
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

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_MAJORS_SUCCESS, majorList));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
