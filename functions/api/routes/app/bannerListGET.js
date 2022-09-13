const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { imageDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  let client;

  try {
    client = await db.connect(req);

    const bannerList = await imageDB.getBannerImageList(client);
    let iOS = [],
      AOS = [];
    bannerList.map(function (data) {
      if (data.type == "iOS") {
        iOS.push(data.imageUrl);
      } else {
        AOS.push(data.imageUrl);
      }
    });

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_APP_BANNER, { iOS, AOS }));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
