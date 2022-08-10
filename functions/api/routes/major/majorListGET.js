const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { majorDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");
const { NO_INFO, NOT_ENTERED, NO_MAJOR } = require("../../../constants/major");

module.exports = async (req, res) => {
  const { universityId } = req.params;
  const { filter, exclude } = req.query;

  if (!universityId || !filter) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let isFirstMajor, isSecondMajor, invisibleMajorIds;

    if (filter === "all") {
      isFirstMajor = [true, false];
      isSecondMajor = [true, false];

      if (exclude === "noMajor") {
        invisibleMajorIds = [...NO_INFO, ...NOT_ENTERED, ...NO_MAJOR];
      } else {
        invisibleMajorIds = [...NO_INFO, ...NOT_ENTERED];
      }
    } else if (filter === "firstMajor") {
      isFirstMajor = [true];
      isSecondMajor = [true, false];
      invisibleMajorIds = [...NO_INFO, ...NO_MAJOR];
    } else if (filter === "secondMajor") {
      isFirstMajor = [true, false];
      isSecondMajor = [true];
      invisibleMajorIds = [...NO_INFO, ...NO_MAJOR];
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_FILTER));
    }

    const majorList = await majorDB.getMajorListByUniversityId(
      client,
      universityId,
      isFirstMajor,
      isSecondMajor,
      invisibleMajorIds,
    );

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
