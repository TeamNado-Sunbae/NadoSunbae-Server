const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const postType = require("../../../constants/postType");
const db = require("../../../db/db");
const { classroomPostDB, userDB, majorDB, likeDB, commentDB, blockDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const dateHandlers = require("../../../lib/dateHandlers");
const reportPeriodType = require("../../../constants/reportPeriodType");

module.exports = async (req, res) => {
  const { postId } = req.params;
  if (!postId)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

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

  // 부적절 후기글 등록 유저
  if (req.user.isReviewInappropriate === true) {
    return res
      .status(statusCode.FORBIDDEN)
      .send(
        util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS_INAPPROPRIATE_REVIEW_POST),
      );
  }

  // 후기 미작성자는 정보글 상세조회 불가
  if (req.user.isReviewed === false) {
    return res
      .status(statusCode.FORBIDDEN)
      .send(util.fail(statusCode.FORBIDDEN, responseMessage.IS_REVIEWED_FALSE));
  }

  let client;

  try {
    client = await db.connect(req);

    let classroomPost = await classroomPostDB.getClassroomPostByPostId(client, postId);
    if (!classroomPost) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }
    // post 정보
    const post = {
      postId: classroomPost.id,
      title: classroomPost.title,
      content: classroomPost.content,
      createdAt: classroomPost.createdAt,
    };

    // post 작성자 정보
    let writer = await userDB.getUserByUserId(client, classroomPost.writerId);
    const firstMajorName = await majorDB.getMajorNameByMajorId(client, writer.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, writer.secondMajorId);

    writer = {
      writerId: writer.id,
      profileImageId: writer.profileImageId,
      nickname: writer.nickname,
      firstMajorName: firstMajorName.majorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: secondMajorName.majorName,
      secondMajorStart: writer.secondMajorStart,
    };

    // post 좋아요 정보

    // postType을 알아야 함
    const informationPostTypeId = postType.INFORMATION;

    // 로그인 유저가 좋아요한 상태인지
    const requestUser = req.user;
    let like = await likeDB.getLikeByPostId(
      client,
      classroomPost.id,
      informationPostTypeId,
      requestUser.id,
    );
    let isLiked;
    if (!like) {
      isLiked = false;
    } else {
      isLiked = like.isLiked;
    }

    // post 좋아요 개수
    const likeCount = await likeDB.getLikeCountByPostId(
      client,
      classroomPost.id,
      informationPostTypeId,
    );

    like = {
      isLiked: isLiked,
      likeCount: likeCount.likeCount,
    };

    // post 댓글 정보

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    // post 댓글 개수
    let commentCount = await commentDB.getCommentCountByPostId(
      client,
      classroomPost.id,
      invisibleUserIds,
    );
    commentCount = commentCount.commentCount;

    // post 댓글 리스트 - 삭제 댓글 포함
    let commentList = await commentDB.getCommentListByPostId(
      client,
      classroomPost.id,
      invisibleUserIds,
    );

    commentList = await Promise.all(
      commentList.map(async (comment) => {
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
          nickname: commentWriter.nickname,
          firstMajorName: firstMajorName.majorName,
          firstMajorStart: commentWriter.firstMajorStart,
          secondMajorName: secondMajorName.majorName,
          secondMajorStart: commentWriter.secondMajorStart,
          isPostWriter: commentWriter.id === classroomPost.writerId,
        };

        return {
          commentId: comment.id,
          content: comment.content,
          createdAt: comment.updatedAt,
          isDeleted: comment.isDeleted,
          writer: commentWriter,
        };
      }),
    );

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ONE_POST_SUCCESS, {
        post,
        writer,
        like,
        commentCount,
        commentList,
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
