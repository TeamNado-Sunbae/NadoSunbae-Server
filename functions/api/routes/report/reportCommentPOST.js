const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { commentDB } = require("../../../db");

module.exports = async (req, res) => {
  const { commentId } = req.body;

  if (!commentId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 댓글 신고 횟수 정보 업데이트
    const reportedComment = await commentDB.updateCommentByReport(client, commentId);

    if (!reportedComment) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    const reportCount = reportedComment.reportCount;

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.REPORT_SUCCESS, { commentId, reportCount }),
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
