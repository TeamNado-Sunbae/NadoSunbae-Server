const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const postType = require("../../../constants/postType");
const db = require("../../../db/db");
const { classroomPostDB, userDB, majorDB, likeDB, commentDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const dateHandlers = require("../../../lib/dateHandlers");
const reportPeriodType = require("../../../constants/reportPeriodType");

module.exports = async (req, res) => {
  const { postId } = req.params;
  if (!postId)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    let classroomPost = await classroomPostDB.getClassroomPostByPostId(client, postId);
    if (!classroomPost) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    // questioner, answerer 정보
    const questionerId = classroomPost.writerId;
    const answererId = classroomPost.answererId;

    // 전체질문이나 1:1 질문 상세조회 불가 - 답변자가 본인인 경우 제외
    if (!(answererId && answererId === req.user.id)) {
      // 신고당한 유저
      if (req.user.reportCreatedAt) {
        // 유저 신고 기간
        let reportPeriod;

        // 알럿 메세지
        let reportResponseMessage;

        if (req.user.reportCount === 1) {
          reportPeriod = reportPeriodType.FIRST_PERIOD;
        } else if (req.user.reportCount === 2) {
          reportPeriod = reportPeriodType.SECOND_PERIOD;
        } else if (req.user.reportCount === 3) {
          reportPeriod = reportPeriodType.THIRD_PERIOD;
        } else if (req.user.reportCount >= 4) {
          reportResponseMessage = `신고 누적으로 글 열람 및 작성이 영구적으로 제한됩니다.`;
        }

        // 신고 만료 날짜
        const expirationDate = dateHandlers.getExpirationDateByMonth(
          req.user.reportCreatedAt,
          reportPeriod,
        );

        reportResponseMessage = `신고 누적이용자로 ${expirationDate.format(
          "YYYY년 MM월 DD일",
        )}까지 글 열람 및 작성이 불가능합니다.`;

        return res
          .status(statusCode.FORBIDDEN)
          .send(util.fail(statusCode.FORBIDDEN, reportResponseMessage));
      }
      // 후기 미등록 유저
      if (req.user.isReviewed === false) {
        return res
          .status(statusCode.FORBIDDEN)
          .send(util.fail(statusCode.FORBIDDEN, responseMessage.IS_REVIEWED_FALSE));
      }
    }

    // post 좋아요 정보

    // 1:1 질문인지, 전체 질문인지
    let postTypeId;

    // answererId 없을 때는 전체 질문
    if (!answererId) {
      postTypeId = postType.QUESTION_TO_EVERYONE;
    } else {
      postTypeId = postType.QUESTION_TO_PERSON;
    }

    let like = await likeDB.getLikeByPostId(client, classroomPost.id, postTypeId, req.user.id);
    let isLiked;
    if (!like) {
      isLiked = false;
    } else {
      isLiked = like.isLiked;
    }

    // post 좋아요 개수
    const likeCount = await likeDB.getLikeCountByPostId(client, classroomPost.id, postTypeId);

    like = {
      isLiked: isLiked,
      likeCount: likeCount.likeCount,
    };

    // post 작성자 정보
    let writer = await userDB.getUserByUserId(client, classroomPost.writerId);
    const firstMajorName = await majorDB.getMajorNameByMajorId(client, writer.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, writer.secondMajorId);

    writer = {
      writerId: writer.id,
      profileImageId: writer.profileImageId,
      isQuestioner: true,
      nickname: writer.nickname,
      firstMajorName: firstMajorName.majorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: secondMajorName.majorName,
      secondMajorStart: writer.secondMajorStart,
    };

    // post 정보
    const post = {
      messageId: classroomPost.id,
      title: classroomPost.title,
      content: classroomPost.content,
      createdAt: classroomPost.createdAt,
      isDeleted: classroomPost.isDeleted,
      writer: writer,
    };

    // post 댓글 정보

    // post 댓글 리스트 - 삭제 댓글 포함
    let messageList = await commentDB.getCommentListByPostId(client, classroomPost.id);

    messageList = await Promise.all(
      messageList.map(async (comment) => {
        let commentWriter = await userDB.getUserByUserId(client, comment.writerId);
        const firstMajorName = await majorDB.getMajorNameByMajorId(
          client,
          commentWriter.firstMajorId,
        );
        const secondMajorName = await majorDB.getMajorNameByMajorId(
          client,
          commentWriter.secondMajorId,
        );

        commentWriter = {
          writerId: commentWriter.id,
          profileImageId: commentWriter.profileImageId,
          isQuestioner: commentWriter.id === classroomPost.writerId,
          nickname: commentWriter.nickname,
          firstMajorName: firstMajorName.majorName,
          firstMajorStart: commentWriter.firstMajorStart,
          secondMajorName: secondMajorName.majorName,
          secondMajorStart: commentWriter.secondMajorStart,
        };

        return {
          messageId: comment.id,
          title: "",
          content: comment.content,
          createdAt: comment.createdAt,
          isDeleted: comment.isDeleted,
          writer: commentWriter,
        };
      }),
    );

    // 메세지 리스트 앞에 원글 포함
    messageList.unshift(post);

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ONE_POST_SUCCESS, {
        questionerId,
        answererId,
        like,
        messageList,
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
