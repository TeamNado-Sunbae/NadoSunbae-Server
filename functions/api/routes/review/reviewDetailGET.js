const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, reviewDB, likeDB } = require("../../../db");
const reviewContent = require("../../../constants/reviewContent");
const slackAPI = require("../../../middlewares/slackAPI");
const { likeType } = require("../../../constants/type");

module.exports = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;
  try {
    client = await db.connect(req);

    // 후기글 정보 가져오기
    let review = await reviewDB.getReviewById(client, id);
    if (!review) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }
    // 현재 뷰어의 좋아요 정보 가져오기
    let likeCount = await likeDB.getLikeCountByTarget(client, id, likeType.REVIEW);
    let likeData = await likeDB.getLikeByTarget(client, id, likeType.REVIEW, req.user.id);

    const isLiked = likeData ? likeData.isLiked : false;

    // 후기글 작성자 정보 가져오기
    const writerId = review.writerId;
    let writer = await userDB.getUserByUserId(client, writerId);

    // 후기글 내용 리스트로 보여주기
    let contentList = [];
    let content = [
      review.prosCons,
      review.curriculum,
      review.recommendLecture,
      review.nonRecommendLecture,
      review.career,
      review.tip,
    ];
    let tagName = [
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

    // 후기글 배경 이미지 가져오기
    const backgroundImage = {
      imageId: review.backgroundImageId,
    };

    review = {
      id: review.id,
      oneLineReview: review.oneLineReview,
      contentList: contentList,
      createdAt: review.createdAt,
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

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ONE_POST_SUCCESS, {
        review,
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
