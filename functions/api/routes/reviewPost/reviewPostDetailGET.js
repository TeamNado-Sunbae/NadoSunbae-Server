const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, reviewPostDB, likeDB } = require("../../../db");
const reviewPostContent = require("../../../constants/reviewPostContent");
const slackAPI = require("../../../middlewares/slackAPI");
const dateHandlers = require("../../../lib/dateHandlers");
const reportPeriodType = require("../../../constants/reportPeriodType");
const postType = require("../../../constants/postType");

module.exports = async (req, res) => {
  const { postId } = req.params;

  // 필요한 값이 없을 때 보내주는 response
  if (!postId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

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
    }

    // 신고 만료 날짜
    const expirationDate = dateHandlers.getExpirationDateByMonth(
      req.user.reportCreatedAt,
      reportPeriod,
    );

    reportResponseMessage = `신고 누적이용자로 ${expirationDate.format(
      "YYYY년 MM월 DD일",
    )}까지 글 열람 및 작성이 불가능합니다.`;

    if (req.user.reportCount >= 4) {
      reportResponseMessage = `신고 누적으로 글 열람 및 작성이 영구적으로 제한됩니다.`;
    }

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

  // 후기글 미등록 유저
  if (req.user.isReviewed === false) {
    return res
      .status(statusCode.FORBIDDEN)
      .send(util.fail(statusCode.FORBIDDEN, responseMessage.IS_REVIEWED_FALSE));
  }

  let client;

  // 에러 트래킹을 위해 try / catch문을 사용합니다.
  // try문 안에서 우리의 로직을 실행합니다.
  try {
    // db/db.js에 정의한 connect 함수를 통해 connection pool에서 connection을 빌려옵니다.
    client = await db.connect(req);

    // 빌려온 connection을 사용해 우리가 db/[파일].js에서 미리 정의한 SQL 쿼리문을 날려줍니다.

    // 후기글 정보 가져오기
    let post = await reviewPostDB.getReviewPostByPostId(client, postId);
    if (!post) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }
    // 현재 뷰어의 좋아요 정보 가져오기 (후기글의 postTypeId는 1 )
    let likeCount = await likeDB.getLikeCountByPostId(client, postId, postType.REVIEW);
    let likeData = await likeDB.getLikeByPostId(client, postId, postType.REVIEW, req.user.id);

    const isLiked = likeData ? likeData.isLiked : false;

    // 후기글 작성자 정보 가져오기
    const writerId = post.writerId;
    let writer = await userDB.getUserByUserId(client, writerId);

    // 후기글 내용 리스트로 보여주기
    let contentList = [];
    let content = [
      post.prosCons,
      post.curriculum,
      post.recommendLecture,
      post.nonRecommendLecture,
      post.career,
      post.tip,
    ];
    let tagName = [
      reviewPostContent.PROS_CONS,
      reviewPostContent.CURRICULUM,
      reviewPostContent.RECOMMEND_LECTURE,
      reviewPostContent.NON_RECOMMEND_LECTURE,
      reviewPostContent.CAREER,
      reviewPostContent.TIP,
    ];

    for (let i = 0; i < tagName.length; i++) {
      if (content[i]) {
        contentList.push({
          title: tagName[i],
          content: content[i],
        });
      }
    }

    // 후기글 배경 이미지 가져오기
    const backgroundImage = {
      imageId: post.backgroundImageId,
    };

    post = {
      postId: post.id,
      oneLineReview: post.oneLineReview,
      contentList: contentList,
      createdAt: post.createdAt,
    };

    writer = {
      writerId: writer.id,
      profileImageId: writer.profileImageId,
      nickname: writer.nickname,
      firstMajorName: writer.firstMajorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: writer.secondMajorName,
      secondMajorStart: writer.secondMajorStart,
      isOnQuestion: writer.isOnQuestion,
      isReviewed: writer.isReviewed,
    };

    const like = {
      isLiked: isLiked,
      likeCount: likeCount.likeCount,
    };

    // 성공적으로 post를 가져왔다면, response를 보내줍니다.
    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ONE_POST_SUCCESS, {
        post,
        writer,
        like,
        backgroundImage,
      }),
    );

    // try문 안에서 에러가 발생했을 시 catch문으로 error객체가 넘어옵니다.
    // 이 error 객체를 콘솔에 찍어서 어디에 문제가 있는지 알아냅니다.
    // 이 때 단순히 console.log만 해주는 것이 아니라, Firebase 콘솔에서도 에러를 모아볼 수 있게 functions.logger.error도 함께 찍어줍니다.
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

    // 그리고 역시 response 객체를 보내줍니다.
    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));

    // finally문은 try문이 끝나든 catch문이 끝나든 반드시 실행되는 블록입니다.
    // 여기서는 db.connect(req)를 통해 빌려온 connection을 connection pool에 되돌려줍니다.
    // connection을 되돌려주는 작업은 반드시 이루어져야 합니다.
    // 그렇지 않으면 요청의 양이 일정 수준을 넘어갈 경우 쌓이기만 하고 해결되지 않는 문제가 발생합니다.
  } finally {
    client.release();
  }
};
