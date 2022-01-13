const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { imageDB } = require("../../../db");

module.exports = async (req, res) => {
  let client;

  try {
    client = await db.connect(req);

    const backgroundImages = await imageDB.getReviewPostBackgroundImages(client);
    if (!backgroundImages) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.NO_CONTENT, responseMessage.NULL_VALUE));
    }

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_BACKGROUND_IMAGE_SUCCESS, {
        backgroundImageList: backgroundImages,
      }),
    );
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
