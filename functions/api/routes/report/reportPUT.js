const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reportDB, userDB, reviewPostDB, classroomPostDB, commentDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const reportType = require("../../../constants/reportType");
const { TOKEN_EXPIRED } = require("../../../constants/jwt");

module.exports = async (req, res) => {
  const { reportId } = req.params;

  if (!reportId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // admin으로 사용할 계정의 nickname
    const adminNickname = "nadosunbae_admin";

    const adminUser = await userDB.getUserByNickname(client, adminNickname);

    // admin 외의 계정으로 접근할 시 에러 반환
    if (req.user.id !== adminUser.id) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.FORBIDDEN_ACCESS));
    }

    // 신고 접수됨 - 1. 글 or 댓글은 삭제 , 2. 유저는 활동 권한 막음

    let updatedReport = await reportDB.updateReportListByIsReported(client, [reportId], true);
    updatedReport = updatedReport[0];
    if (!updatedReport) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_REPORT));
    }

    // updatedReport와 같은 reportedTarget 대한 report는 자동으로 접수 처리 (is_reported = true)
    // 같은 reportedTarget을 가지는 report id의 list

    const reportIdListByReportedTarget = await reportDB.getReportListByReportedTarget(
      client,
      updatedReport.reportedTargetId,
      updatedReport.reportedTargetTypeId,
    );

    let reportIdList = [];
    reportIdListByReportedTarget.map((report) => {
      reportIdList.push(report.id);
    });

    // 같은 reportedTarget을 가지는 report id가 있을 때만 해당 report 자동 접수 처리 (is_reported = true)
    let updatedReportList = [];
    if (reportIdList.length !== 0) {
      updatedReportList = await reportDB.updateReportListByIsReported(client, [reportIdList], true);
      if (updatedReportList.length === 0) {
        return res
          .status(statusCode.NOT_FOUND)
          .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_REPORT));
      }
    }

    // 1. 신고된 report의 글 or 댓글은 삭제함

    let deletedReportedTarget;
    if (updatedReport.reportedTargetTypeId === reportType.REVIEW_POST) {
      // 후기글 삭제
      deletedReportedTarget = await reviewPostDB.deleteReviewPost(
        client,
        updatedReport.reportedTargetId,
      );
    } else if (updatedReport.reportedTargetTypeId === reportType.CLASSROOM_POST) {
      // 과방글(질문글, 정보글) 삭제
      deletedReportedTarget = await classroomPostDB.deleteClassroomPostByPostId(
        client,
        updatedReport.reportedTargetId,
      );
    } else if (updatedReport.reportedTargetTypeId === reportType.COMMENT) {
      // 댓글 삭제
      deletedReportedTarget = await commentDB.deleteCommentByCommentId(
        client,
        updatedReport.reportedTargetId,
      );
    } else {
      // 잘못된 report type
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.success(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
    }

    // 삭제 시도한 글/댓글이 없을 경우
    if (!deletedReportedTarget) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_REPORT_TARGET));
    }

    // 2. 신고된 유저는 권한을 막음
    const reportedUser = await userDB.getUserByUserId(client, updatedReport.reportedUserId);
    if (!reportedUser) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
    }

    let reportResponseMessage;
    let updatedUser;
    // 해당 유저에 대해 모든 신고가 만료되었거나 아직 제재 당한 적이 없는 경우
    if (!reportedUser.reportCreatedAt) {
      // 신고 접수 시간을 현재로 하고 reportCount를 1 증가한 후, 로그아웃을 위해 refreshtoken을 만료시킴
      updatedUser = await userDB.updateUserByReport(
        client,
        reportedUser.id,
        reportedUser.reportCount + 1,
        TOKEN_EXPIRED,
      );
      reportResponseMessage = `신고한 글 또는 댓글이 삭제되었습니다. 신고 접수 횟수 1번 추가되어 (${updatedUser.reportCreatedAt.toLocaleString()} 기준) id ${
        reportedUser.id
      }번 유저 누적 신고 횟수는 ${updatedUser.reportCount}회입니다`;
    } else {
      // 해당 유저에 대해 신고가 이미 접수되어 제재 당하고 있는 경우
      reportResponseMessage = `신고한 글 또는 댓글이 삭제되었습니다. 이미 권한이 제한되었으므로 누적 신고 횟수는 유지되었으며 (${reportedUser.reportCreatedAt.toLocaleString()} 기준) id ${
        reportedUser.id
      }번 유저 누적 신고 횟수는 ${reportedUser.reportCount}회입니다`;
    }

    let moreReportResponseMessage;

    // 오늘 날짜를 한국 표준시로
    const today = new Date();
    const utcNow = today.getTime() + today.getTimezoneOffset() * 60 * 1000;
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000; // UTC보다 9시간 빠름
    const krNow = new Date(utcNow + KR_TIME_DIFF);

    const moreReportList = await reportDB.getReportListByReportedUser(client, reportedUser.id);
    let moreReportIdList = [];
    moreReportList.map((report) => {
      moreReportIdList.push(report.id);
    });
    if (moreReportList.length !== 0) {
      moreReportResponseMessage = `[추가 신고 접수 권고] (${krNow.toLocaleString()} 기준) id ${
        reportedUser.id
      }번 유저의 다른 글 또는 댓글에 대한 신고 중 아직 접수되지 않은 신고가 ${
        moreReportList.length
      }건 존재합니다. 기간이 지나고 신고를 접수할 경우 유저가 중복 제재를 받을 수 있으니 주의하시기 바랍니다. 관련 report id :  ${moreReportIdList}`;
    } else {
      moreReportResponseMessage = `(${krNow.toLocaleString()} 기준) id ${
        reportedUser.id
      }번 유저에 대한 신고는 모두 접수 완료되었습니다.`;
    }

    let user;
    if (!updatedUser) {
      user = {
        userId: reportedUser.id,
        reportCount: reportedUser.reportCount,
        reportCreatedAt: reportedUser.reportCreatedAt,
        refreshtoken: reportedUser.refreshToken,
      };
    } else {
      user = {
        userId: updatedUser.id,
        reportCount: updatedUser.reportCount,
        reportCreatedAt: updatedUser.reportCreatedAt,
        refreshtoken: updatedUser.refreshToken,
      };
    }

    // isReported = true 처리된 모든 report 리스트
    let isReportedList = [];
    isReportedList.push(updatedReport.id);

    updatedReportList.map((report) => {
      isReportedList.push(report.id);
    });

    res.status(statusCode.OK).send(
      util.success(
        statusCode.OK,
        {
          report: `[${responseMessage.IS_REPORTED_SUCCESS}] ${reportResponseMessage}`,
          moreReport: `${moreReportResponseMessage}`,
        },
        {
          isReportedList: isReportedList,
          reportedTarget: {
            reportedTargetTypeId: updatedReport.reportedTargetTypeId,
            reportedTargetId: updatedReport.reportedTargetId,
            isDeleted: deletedReportedTarget.isDeleted,
          },
          reportedUser: user,
        },
      ),
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
