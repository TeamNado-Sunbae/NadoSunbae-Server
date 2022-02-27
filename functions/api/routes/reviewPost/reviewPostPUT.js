const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewPostDB, userDB, imageDB, likeDB, relationReviewPostTagDB } = require("../../../db");
const reviewPostContent = require("../../../constants/reviewPostContent");
const slackAPI = require("../../../middlewares/slackAPI");
const postType = require("../../../constants/postType");

module.exports = async (req, res) => {
  const { postId } = req.params;
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

  if (!postId || !backgroundImageId || !oneLineReview || !prosCons) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 해당 글이 있는지 확인
    const reviewPost = await reviewPostDB.getReviewPostByPostId(client, postId);
    if (!reviewPost) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    let updatedReviewPost = await reviewPostDB.updateReviewPost(
      client,
      postId,
      backgroundImageId,
      oneLineReview,
      prosCons,
      curriculum,
      recommendLecture,
      nonRecommendLecture,
      career,
      tip,
    );

    let writer = await userDB.getUserByUserId(client, updatedReviewPost.writerId);

    let contentList = [];
    const content = [
      updatedReviewPost.prosCons,
      updatedReviewPost.curriculum,
      updatedReviewPost.recommendLecture,
      updatedReviewPost.nonRecommendLecture,
      updatedReviewPost.career,
      updatedReviewPost.tip,
    ];
    const tagName = [
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
      firstMajorName: writer.firstMajorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: writer.secondMajorName,
      secondMajorStart: writer.secondMajorStart,
    };

    const likeCount = await likeDB.getLikeCountByPostId(client, updatedReviewPost.id);
    let likeStatus = await likeDB.getLikeByPostId(client, postId, postType.REVIEW, req.user.id);
    if (!likeStatus) {
      likeStatus = false;
    } else {
      likeStatus = likeStatus.isLiked;
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

    // 현재 릴레이션 태그
    const originalTagListData = await relationReviewPostTagDB.getTagListByReviewPostId(
      client,
      postId,
    );
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
      const deletedRelation = await relationReviewPostTagDB.deleteRelationReviewPostTagByTagList(
        client,
        postId,
        deleteTagList,
      );
      if (!deletedRelation) {
        return res
          .status(statusCode.NOT_FOUND)
          .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_RELATION_POST_TAG));
      }
    }

    // 새롭게 만들어야하는 후기 - 태그 릴레이션 추가
    let createTagList = newTagList.filter((x) => !originalTagList.includes(x));
    createTagList.map(async (tag) => {
      await relationReviewPostTagDB.createRelationReviewPostTag(client, postId, tag);
    });

    res
      .status(statusCode.OK)
      .send(
        util.success(statusCode.OK, responseMessage.UPDATE_ONE_POST_SUCCESS, updatedReviewPost),
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
