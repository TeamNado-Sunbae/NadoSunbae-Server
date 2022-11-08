const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const {
  reviewDB,
  userDB,
  tagDB,
  majorDB,
  relationReviewTagDB,
  inappropriateReviewDB,
  universityDB,
} = require("../../../db");
const {
  PROS_CONS,
  CURRICULUM,
  RECOMMEND_LECTURE,
  NON_RECOMMEND_LECTURE,
  CAREER,
  TIP,
} = require("../../../constants/reviewContent");
const backgroundImage = require("../../../constants/backgroundImage");
const errorHandlers = require("../../../lib/errorHandlers");
const slackAPI = require("../../../middlewares/slackAPI");

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

    // req.body로 받은 정보와 isFirstMajor를 가지고 review를 생성
    let review = await reviewDB.createReview(
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

    // curriculum, recommendLecture, nonRecommendLecture, career, tip 중 정보를 작성한 항목은 태그 검색되도록 relationReviewTag 생성
    let content = [curriculum, recommendLecture, nonRecommendLecture, career, tip];
    let tagName = [CURRICULUM, RECOMMEND_LECTURE, NON_RECOMMEND_LECTURE, CAREER, TIP];
    let tagByTagName;
    let relationReviewTag;

    for (let i = 0; i < tagName.length; i++) {
      if (content[i]) {
        tagByTagName = await tagDB.getTagByTagName(client, tagName[i]);
        relationReviewTag = await relationReviewTagDB.createRelationReviewTag(
          client,
          review.id,
          tagByTagName.id,
        );
      }
    }

    // review를 작성한 writer는 isReviewed를 true로 업데이트
    let updatedUser = await userDB.updateUserByIsReviewed(client, true, req.user.id);

    // review, writer, like, backgroundImage 객체로 묶어서 보냄
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
      imageId: review.backgroundImageId,
    };

    const inappropriateReview = await inappropriateReviewDB.getInappropriateReviewByUser(
      client,
      req.user.id,
    );
    if (inappropriateReview) {
      const deletedInappropriateReview = await inappropriateReviewDB.deleteInappropriateReviewList(
        client,
        req.user.id,
      );
    }

    review = {
      id: review.id,
      oneLineReview: review.oneLineReview,
      contentList: contentList,
      createdAt: review.createdAt,
    };

    res.status(statusCode.CREATED).send(
      util.success(statusCode.CREATED, responseMessage.CREATE_ONE_POST_SUCCESS, {
        review,
        writer,
        like,
        backgroundImage,
      }),
    );

    // 슬랙에 알림 전송
    const [university, major] = await Promise.all([
      universityDB.getNameByMajorId(client, majorId),
      majorDB.getMajorByMajorId(client, majorId),
    ]);

    const slackMessage = `[NEW REVIEW]\n id: ${review.id}\nuniversity: ${university.universityName}\nmajor: ${major.majorName}\nwriterId: ${writer.writerId} `;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_USER_MONITORING);
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
