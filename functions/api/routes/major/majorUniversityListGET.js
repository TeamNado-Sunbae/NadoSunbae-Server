const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { majorDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");
const { NO_INFO, NOT_ENTERED, NO_MAJOR } = require("../../../constants/major");

module.exports = async (req, res) => {
  const { universityId } = req.params;
  const { filter, exclude, userId } = req.query;

  if (!universityId || !filter) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // filter & exclude query
    let isFirstMajor, isSecondMajor, invisibleMajorNames;

    if (filter === "all") {
      isFirstMajor = [true, false];
      isSecondMajor = [true, false];

      if (exclude === "noMajor") {
        invisibleMajorNames = [...NO_INFO, ...NOT_ENTERED, ...NO_MAJOR];
      } else {
        invisibleMajorNames = [...NO_INFO, ...NOT_ENTERED];
      }
    } else if (filter === "firstMajor") {
      isFirstMajor = [true];
      isSecondMajor = [true, false];
      invisibleMajorNames = [...NO_INFO, ...NO_MAJOR];
    } else if (filter === "secondMajor") {
      isFirstMajor = [true, false];
      isSecondMajor = [true];
      invisibleMajorNames = [...NO_INFO, ...NO_MAJOR];
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
      invisibleMajorNames,
      userId,
    );

    // separate major by default major, other major, other campus
    let defaultMajor = [],
      otherMajor = [],
      otherCampus = [],
      favorites = [];

    majorList.map((m) => {
      if ([...NOT_ENTERED, ...NO_MAJOR].includes(m.majorName)) {
        otherMajor.push(m);
      } else if (m.isFavorites) {
        favorites.push(m);
      } else if (m.majorName.includes("(")) {
        otherCampus.push(m);
      } else {
        defaultMajor.push(m);
      }
    });

    // sort by korean, alphabetical order
    const isCharKorean = (char) => {
      return char >= "가" && char <= "힣";
    };

    favorites = _.sortBy(favorites, [(m) => !isCharKorean(m.majorName[0]), "majorName"]);
    defaultMajor = _.sortBy(defaultMajor, [(m) => !isCharKorean(m.majorName[0]), "majorName"]);
    otherCampus = _.sortBy(otherCampus, [(m) => !isCharKorean(m.majorName[0]), "majorName"]);

    // other major first, followed by default major, other campus
    const result = otherMajor.concat(favorites, defaultMajor, otherCampus);

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_MAJORS_SUCCESS, result));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
