const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { favoritesDB, majorDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");
const { NO_INFO, NOT_ENTERED, NO_MAJOR } = require("../../../constants/major");

module.exports = async (req, res) => {
  const { majorId } = req.body;

  if (!majorId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    const major = await majorDB.getMajorByExcludeMajorNames(
      client,
      [...NO_INFO, ...NOT_ENTERED, ...NO_MAJOR],
      majorId,
    );

    if (!major) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_MAJOR));
    }

    const favorites = await favoritesDB.updateFavorites(client, majorId, req.user.id);

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.UPDATE_FAVORITES_SUCCESS, favorites));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
