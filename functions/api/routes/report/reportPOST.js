const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reportDB, reviewDB, postDB, commentDB } = require("../../../db");
const { reportType } = require("../../../constants/type");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { targetId, type, reason } = req.body;

  if (!targetId || !type || !reason) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 신고하는 유저
    const reportUserId = req.user.id;

    let targetTypeId;
    let reportTarget;
    if (type === "review") {
      targetTypeId = reportType.REVIEW;
      reportTarget = await reviewDB.getReviewById(client, targetId);
    } else if (type === "post") {
      targetTypeId = reportType.POST;
      reportTarget = await postDB.getPostByPostId(client, targetId);
    } else if (type === "comment") {
      targetTypeId = reportType.COMMENT;
      reportTarget = await commentDB.getCommentByCommentId(client, targetId);
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_TYPE));
    }
    // 신고 대상인 글/댓글이 없는 경우
    if (!reportTarget) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_REPORT_TARGET));
    }

    // 이미 해당 글 or 댓글에 신고한 경우 사유가 달라도 재신고할 수 없음
    const existingReport = await reportDB.getReportByReportUser(
      client,
      reportUserId,
      targetId,
      targetTypeId,
    );
    if (existingReport) {
      return res
        .status(statusCode.CONFLICT)
        .send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_REPORT));
    }

    // 신고 당하는 유저 - 글 or 댓글의 작성자
    const reportedUserId = reportTarget.writerId;

    // 신고 테이블에 추가
    const report = await reportDB.createReport(
      client,
      reportUserId,
      reportedUserId,
      targetId,
      targetTypeId,
      reason,
    );

    res.status(statusCode.CREATED).send(
      util.success(statusCode.CREATED, responseMessage.REPORT_SUCCESS, {
        reportId: report.id,
        createdAt: report.createdAt,
      }),
    );
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
