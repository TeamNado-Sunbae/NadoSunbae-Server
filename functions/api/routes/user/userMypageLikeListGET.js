const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const {
  reviewPostDB,
  relationReviewPostTagDB,
  classroomPostDB,
  likeDB,
  commentDB,
  userDB,
} = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const postType = require("../../../constants/postType");

module.exports = async (req, res) => {
  const { type } = req.query;

  if (!type) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 좋아요 목록 게시글 리스트
    let likePostList;

    // 후기글일 경우
    if (type === "review") {
      likePostList = await reviewPostDB.getReviewPostListByLike(
        client,
        req.user.id,
        postType.REVIEW,
      );

      likePostList = await Promise.all(
        likePostList.map(async (reviewPost) => {
          // 게시글 작성자 정보
          const writer = await userDB.getUserByUserId(client, reviewPost.writerId);

          // 태그 정보
          const tagNameList = await relationReviewPostTagDB.getTagListByPostId(
            client,
            reviewPost.id,
          );

          // 좋아요 정보
          const isLiked = true; // 좋아요 목록이므로 모두 true
          const likeCount = await likeDB.getLikeCountByPostId(
            client,
            reviewPost.id,
            postType.REVIEW,
          );
          const like = {
            isLiked: isLiked,
            likeCount: likeCount.likeCount,
          };
          return {
            postId: reviewPost.id,
            title: reviewPost.oneLineReview,
            createdAt: reviewPost.createdAt,
            tagList: tagNameList,
            writer: {
              writerId: writer.id,
              nickname: writer.nickname,
            },
            like: like,
          };
        }),
      );
      // 과방글일 경우
    } else if (type === "information" || type === "question") {
      let postTypeIds;
      // 정보글인지 질문글인지에 따라 postTypeIds 결정
      if (type === "information") {
        postTypeIds = [postType.INFORMATION];
      } else if (type === "question") {
        postTypeIds = [postType.QUESTION_TO_EVERYONE, postType.QUESTION_TO_PERSON];
      }

      likePostList = await classroomPostDB.getClassroomPostListByLike(
        client,
        req.user.id,
        postTypeIds,
      );

      likePostList = await Promise.all(
        likePostList.map(async (classroomPost) => {
          // 게시글 작성자 정보
          const writer = await userDB.getUserByUserId(client, classroomPost.writerId);

          // 댓글 개수
          const commentCount = await commentDB.getCommentCountByPostId(client, classroomPost.id);

          // 좋아요 정보
          const isLiked = true; // 좋아요 목록이므로 모두 true
          const likeCount = await likeDB.getLikeCountByPostId(
            client,
            classroomPost.id,
            classroomPost.postTypeId,
          );
          const like = {
            isLiked: isLiked,
            likeCount: likeCount.likeCount,
          };
          return {
            postId: classroomPost.id,
            title: classroomPost.title,
            content: classroomPost.content,
            createdAt: classroomPost.createdAt,
            writer: {
              writerId: writer.id,
              nickname: writer.nickname,
            },
            commentCount: commentCount.commentCount,
            like: like,
          };
        }),
      );
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_TYPE));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, { likePostList }));
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
