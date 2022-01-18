const _ = require("lodash");
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
  majorDB,
  imageDB,
} = require("../../../db");
const {
  PROS_CONS,
  CURRICULUM,
  RECOMMEND_LECTURE,
  NON_RECOMMEND_LECTURE,
  CAREER,
  TIP,
} = require("../../../constants/reviewPostContent");

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

  let client;

  try {
    client = await db.connect(req);

    // majorId에 따라 isFirstMajor 결정
    const UserByFirstMajorId = await userDB.getUserByFirstMajorId(client, majorId);
    let isFirstMajor = true;
    if (UserByFirstMajorId.length === 0) {
      isFirstMajor = false;
    }

    // writerId는 accesstoken을 디코딩하여 받은 id를 사용
    const writerId = req.user.id;

    // req.body로 받은 정보와 isFirstMajor, writerId를 가지고 reviewPost를 생성
    let reviewPost = await reviewPostDB.createReviewPost(
      client,
      majorId,
      writerId,
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
    let updatedUser = await userDB.updateUserByIsReviewed(client, true, writerId);

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

    const firstMajorName = await majorDB.getMajorNameByMajorId(client, updatedUser.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, updatedUser.secondMajorId);
    const writer = {
      writerId: updatedUser.id,
      nickname: updatedUser.nickname,
      profileImageId: updatedUser.profileImageId,
      firstMajorName: firstMajorName.majorName,
      firstMajorStart: updatedUser.firstMajorStart,
      secondMajorName: secondMajorName.majorName,
      secondMajorStart: updatedUser.secondMajorStart,
      isOnQuestion: updatedUser.isOnQuestion,
      isReviewed: updatedUser.isReviewed,
    };

    const like = {
      isLiked: false,
      likeCount: 0,
    };

    const backgroundImageUrl = await imageDB.getImageUrlByImageId(
      client,
      reviewPost.backgroundImageId,
    );
    const backgroundImage = {
      imageId: reviewPost.backgroundImageId,
      imageUrl: backgroundImageUrl,
    };

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

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
