const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewPostDB, userDB, majorDB, imageDB, likeDB } = require("../../../db");
const reviewPostContent = require("../../../constants/reviewPostContent");

module.exports = async (req, res) => {
  const { postId } = req.params;
  const {
    backgroundImageId,
    oneLineReview,
    prosCons,
    curriculum,
    career,
    recommendLecture,
    nonRecommendLecture,
    tip,
  } = req.body;

  // 필수로 받아야하는 데이터들
  if (!postId || !backgroundImageId || !oneLineReview || !prosCons)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    // 403 error는 클라에서 확인

    let updatedReviewPost = await reviewPostDB.updateReviewPost(
      client,
      postId,
      backgroundImageId,
      oneLineReview,
      prosCons,
      curriculum,
      career,
      recommendLecture,
      nonRecommendLecture,
      tip,
    );

    let writer = await userDB.getUserByUserId(client, updatedReviewPost.writerId);
    const firstMajorName = await majorDB.getMajorNameByMajorId(client, writer.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, writer.secondMajorId);

    let contentList = [];
    const content = [
      updatedReviewPost.prosCons,
      updatedReviewPost.curriculum,
      updatedReviewPost.career,
      updatedReviewPost.recommendLecture,
      updatedReviewPost.nonRecommendLecture,
      updatedReviewPost.tip,
    ];
    const tagName = [
      reviewPostContent.PROS_CONS,
      reviewPostContent.CURRICULUM,
      reviewPostContent.CAREER,
      reviewPostContent.RECOMMEND_LECTURE,
      reviewPostContent.NON_RECOMMEND_LECTURE,
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

    const post = {
      postId: updatedReviewPost.id,
      oneLineReview: updatedReviewPost.oneLineReview,
      contentList: contentList,
      createdAt: updatedReviewPost.createdAt,
      updatedAt: updatedReviewPost.updatedAt,
    };

    writer = {
      writerId: writer.id,
      profileImageId: writer.profileImageId,
      nickname: writer.nickname,
      firstMajorName: firstMajorName.majorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: secondMajorName.majorName,
      secondMajorStart: writer.secondMajorStart,
    };

    const likeCount = await likeDB.getLikeCountByPostId(client, updatedReviewPost.id);
    let likeStatus = await likeDB.getLikeByPostId(client, postId, 1, req.user.id);
    if (!likeStatus) {
      likeStatus = false;
    } else {
      likeStatus = true;
    }

    const backgroundImage = await imageDB.getImageUrlByImageId(
      client,
      updatedReviewPost.backgroundImageId,
    );

    updatedReviewPost = {
      post: post,
      writer: writer,
      like: { isLiked: likeStatus, likeCount: likeCount.likeCount },
      backgroundImage: { imageId: backgroundImageId, imageUrl: backgroundImage.imageUrl },
    };

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.UPDATE_ONE_COMMENT_SUCCESS, updatedReviewPost),
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
