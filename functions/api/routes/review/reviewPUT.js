const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewDB, likeDB, relationReviewTagDB } = require("../../../db");
const reviewContent = require("../../../constants/reviewContent");
const slackAPI = require("../../../middlewares/slackAPI");
const postType = require("../../../constants/postType");
const backgroundImage = require("../../../constants/backgroundImage");

module.exports = async (req, res) => {
  const { id } = req.params;
  const {
    backgroundImageId,
    oneLineReview,
    prosCons,
    curriculum,
    recommendLecture,
    nonRecommendLecture,
    career,
    tip,
  } = req.body;

  if (!id || !backgroundImageId || !oneLineReview || !prosCons) {
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

    const review = await reviewDB.getReviewByPostId(client, id);
    if (!review) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    // 수정하려는 유저와 작성자 정보가 일치하는지 확인
    if (review.writerId !== req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
    }

    let updatedReview = await reviewDB.updateReview(
      client,
      id,
      backgroundImageId,
      oneLineReview,
      prosCons,
      curriculum,
      recommendLecture,
      nonRecommendLecture,
      career,
      tip,
    );

    let contentList = [];
    const content = [
      updatedReview.prosCons,
      updatedReview.curriculum,
      updatedReview.recommendLecture,
      updatedReview.nonRecommendLecture,
      updatedReview.career,
      updatedReview.tip,
    ];
    const tagName = [
      reviewContent.PROS_CONS,
      reviewContent.CURRICULUM,
      reviewContent.RECOMMEND_LECTURE,
      reviewContent.NON_RECOMMEND_LECTURE,
      reviewContent.CAREER,
      reviewContent.TIP,
    ];

    for (let i = 0; i < tagName.length; i++) {
      if (content[i]) {
        contentList.push({
          title: tagName[i],
          content: content[i],
        });
      }
    }

    const post = {
      postId: updatedReview.id,
      oneLineReview: updatedReview.oneLineReview,
      contentList: contentList,
      createdAt: updatedReview.createdAt,
      updatedAt: updatedReview.updatedAt,
    };

    const writer = {
      writerId: req.user.id,
      profileImageId: req.user.profileImageId,
      nickname: req.user.nickname,
      firstMajorName: req.user.firstMajorName,
      firstMajorStart: req.user.firstMajorStart,
      secondMajorName: req.user.secondMajorName,
      secondMajorStart: req.user.secondMajorStart,
    };

    const likeCount = await likeDB.getLikeCountByPostId(client, updatedReview.id);
    const likeStatus = await likeDB.getLikeByPostId(client, id, postType.REVIEW, req.user.id);

    const isLiked = likeStatus ? likeStatus.isLiked : false;

    updatedReview = {
      post: post,
      writer: writer,
      like: { isLiked: isLiked, likeCount: likeCount.likeCount },
      backgroundImage: { imageId: backgroundImageId },
    };

    // 현재 릴레이션 태그
    const originalTagListData = await relationReviewTagDB.getTagListByReviewId(client, id);
    let originalTagList = [];
    originalTagListData.map((tag) => {
      originalTagList.push(tag.tagId);
    });

    // 새롭게 필요한 릴레이션 태그
    let newTagList = [];
    for (let i = 1; i < tagName.length; i++) {
      if (content[i]) {
        newTagList.push(i);
      }
    }

    // 없어져야하는 후기 - 태그 릴레이션 삭제
    let deleteTagList = originalTagList.filter((x) => !newTagList.includes(x));
    // 차집합이 있으면
    if (deleteTagList.length !== 0) {
      const deletedRelation = await relationReviewTagDB.deleteRelationReviewTagByTagList(
        client,
        id,
        deleteTagList,
      );
      if (!deletedRelation) {
        return res
          .status(statusCode.NOT_FOUND)
          .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST_TAG_RELATION));
      }
    }

    // 새롭게 만들어야하는 후기 - 태그 릴레이션 추가
    let createTagList = newTagList.filter((x) => !originalTagList.includes(x));
    createTagList.map(async (tag) => {
      await relationReviewTagDB.createRelationReviewTag(client, id, tag);
    });

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.UPDATE_ONE_POST_SUCCESS, updatedReview));
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
