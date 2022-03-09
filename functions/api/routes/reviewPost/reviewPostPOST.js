const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const {
  reviewPostDB,
  userDB,
  tagDB,
  relationReviewPostTagDB,
  inappropriateReviewPostDB,
} = require("../../../db");
const {
  PROS_CONS,
  CURRICULUM,
  RECOMMEND_LECTURE,
  NON_RECOMMEND_LECTURE,
  CAREER,
  TIP,
} = require("../../../constants/reviewPostContent");
const slackAPI = require("../../../middlewares/slackAPI");
const dateHandlers = require("../../../lib/dateHandlers");
const reportPeriodType = require("../../../constants/reportPeriodType");
const backgroundImage = require("../../../constants/backgroundImage");

module.exports = async (req, res) => {
  const {
    majorId,
    backgroundImageId,
    oneLineReview,
    prosCons,
    curriculum,
    recommendLecture,
    nonRecommendLecture,
    career,
    tip,
  } = req.body;

  // 필요한 값이 없으면 실패 response
  if (!majorId || !backgroundImageId || !oneLineReview || !prosCons) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  // background image id가 정해진 id 범위에 맞지 않을 경우
  if (backgroundImage.ID_RANGE.indexOf(backgroundImageId) === -1) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    const user = await userDB.getUserByUserId(client, req.user.id);

    // majorId에 따라 isFirstMajor 결정
    let isFirstMajor;

    if (user.firstMajorId === majorId) {
      isFirstMajor = true;
    } else if (user.secondMajorId === majorId) {
      isFirstMajor = false;
    } else {
      // req로 들어온 majorId가 로그인한 유저의 본전공도 아니고 제2전공도 아니면 에러 처리
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.OUT_OF_VALUE));
    }

    // req.body로 받은 정보와 isFirstMajor를 가지고 reviewPost를 생성
    let reviewPost = await reviewPostDB.createReviewPost(
      client,
      majorId,
      req.user.id,
      backgroundImageId,
      isFirstMajor,
      oneLineReview,
      prosCons,
      curriculum,
      recommendLecture,
      nonRecommendLecture,
      career,
      tip,
    );

    // curriculum, recommendLecture, nonRecommendLecture, career, tip 중 정보를 작성한 항목은 태그 검색되도록 relationReviewPostTag 생성
    let content = [curriculum, recommendLecture, nonRecommendLecture, career, tip];
    let tagName = [CURRICULUM, RECOMMEND_LECTURE, NON_RECOMMEND_LECTURE, CAREER, TIP];
    let tagByTagName;
    let relationReviewPostTag;

    for (let i = 0; i < tagName.length; i++) {
      if (content[i]) {
        tagByTagName = await tagDB.getTagByTagName(client, tagName[i]);
        relationReviewPostTag = await relationReviewPostTagDB.createRelationReviewPostTag(
          client,
          reviewPost.id,
          tagByTagName.id,
        );
      }
    }

    // reviewPost를 작성한 writer는 isReviewed를 true로 업데이트
    let updatedUser = await userDB.updateUserByIsReviewed(client, true, req.user.id);

    // post, writer, like, backgroundImage 객체로 묶어서 보냄
    let contentList = [];
    content = [prosCons, curriculum, recommendLecture, nonRecommendLecture, career, tip];
    tagName = [PROS_CONS, CURRICULUM, RECOMMEND_LECTURE, NON_RECOMMEND_LECTURE, CAREER, TIP];

    for (let i = 0; i < tagName.length; i++) {
      if (content[i]) {
        contentList.push({
          title: tagName[i],
          content: content[i],
        });
      }
    }

    const post = {
      postId: reviewPost.id,
      oneLineReview: reviewPost.oneLineReview,
      contentList: contentList,
      createdAt: reviewPost.createdAt,
    };

    const writer = {
      writerId: req.user.id,
      nickname: req.user.nickname,
      profileImageId: req.user.profileImageId,
      firstMajorName: req.user.firstMajorName,
      firstMajorStart: req.user.firstMajorStart,
      secondMajorName: req.user.secondMajorName,
      secondMajorStart: req.user.secondMajorStart,
      isOnQuestion: req.user.isOnQuestion,
      isReviewed: updatedUser.isReviewed,
    };

    const like = {
      isLiked: false,
      likeCount: 0,
    };

    const backgroundImage = {
      imageId: reviewPost.backgroundImageId,
    };

    const inappropriateReviewPost =
      await inappropriateReviewPostDB.getInappropriateReviewPostByUser(client, req.user.id);
    if (inappropriateReviewPost) {
      const deletedInappropriateReviewPost =
        await inappropriateReviewPostDB.deleteInappropriateReviewPostList(client, req.user.id);
    }

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.CREATE_ONE_POST_SUCCESS, {
        post,
        writer,
        like,
        backgroundImage,
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
