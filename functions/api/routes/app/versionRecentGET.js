const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const errorHandlers = require("../../../lib/errorHandlers");
const dotenv = require("dotenv");
dotenv.config();

module.exports = async (req, res) => {
  try {
    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_APP_VERSION, {
        AOS: process.env.VERSION_AOS,
        iOS: process.env.VERSION_IOS,
      }),
    );
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};
