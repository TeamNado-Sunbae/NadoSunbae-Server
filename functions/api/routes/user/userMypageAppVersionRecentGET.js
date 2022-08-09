const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const appVersion = require("../../../constants/appVersion");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  try {
    const data = {
      AOS: appVersion.AOS,
      iOS: appVersion.iOS,
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_APP_VERSION, data));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};
