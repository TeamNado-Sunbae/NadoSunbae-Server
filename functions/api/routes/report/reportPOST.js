const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reportDB, reviewPostDB, classroomPostDB, commentDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const reportType = require("../../../constants/reportType");

module.exports = async (req, res) => {
  const { reportedTargetId, reportedTargetTypeId, reason } = req.body;

  if (!reportedTargetId || !reportedTargetTypeId || !reason) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 신고하는 유저
    const reportUserId = req.user.id;

    // 이미 해당 글 or 댓글에 신고한 경우 사유가 달라도 재신고할 수 없음
    const existingReport = await reportDB.getExistingReport(
      client,
      reportUserId,
      reportedTargetId,
      reportedTargetTypeId,
    );

    if (existingReport) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.ALREADY_REPORT));
    }

    // 신고 당하는 유저 - 글 or 댓글의 작성자
    let reportedUserId;

    if (reportedTargetTypeId === reportType.REVIEW_POST) {
      // 후기글 신고
      const reviewPost = await reviewPostDB.getReviewPostByPostId(client, reportedTargetId);

      if (!reviewPost) {
        return res
          .status(statusCode.NOT_FOUND)
          .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
      }

      reportedUserId = reviewPost.writerId;
    } else if (reportedTargetTypeId === reportType.CLASSROOM_POST) {
      // 과방글(질문글, 정보글) 신고
      const classroomPost = await classroomPostDB.getClassroomPostByPostId(
        client,
        reportedTargetId,
      );

      if (!classroomPost) {
        return res
          .status(statusCode.NOT_FOUND)
          .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
      }

      reportedUserId = classroomPost.writerId;
    } else if (reportedTargetTypeId === reportType.COMMENT) {
      // 댓글 신고
      const comment = await commentDB.getCommentByCommentId(client, reportedTargetId);

      if (!comment) {
        return res
          .status(statusCode.NOT_FOUND)
          .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_COMMENT));
      }

      reportedUserId = comment.writerId;
      // 잘못된 report type
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.success(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
    }

    // 신고 테이블에 추가
    const report = await reportDB.createReport(
      client,
      reportUserId,
      reportedUserId,
      reportedTargetId,
      reportedTargetTypeId,
      reason,
    );

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.REPORT_SUCCESS, {
        reportId: report.id,
        createdAt: report.createdAt,
      }),
    );
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${
      req.originalUrl
    } ${error} ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
