const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  try {
    const linkList = {
      personalInformationPolicy:
        "https://www.notion.so/nadosunbae/V-1-0-2022-3-1-e4637880bb1d4a6e8938f4f0c306b2d5",
      termsOfService:
        "https://www.notion.so/nadosunbae/V-1-0-2022-3-1-d1d15e411b0b417198b2405468894dea",
      openSourceLicense: "https://www.notion.so/nadosunbae/V-1-0-2442b1af796041d09bc6e8729c172438",
      kakaoTalkChannel: "http://pf.kakao.com/_pxcFib",
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_APP_LINK, linkList));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  }
};
