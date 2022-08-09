const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const {
  reviewDB,
  relationReviewTagDB,
  postDB,
  likeDB,
  commentDB,
  userDB,
  blockDB,
} = require("../../../db");
const { postType, likeType } = require("../../../constants/type");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { filter } = req.query;

  if (!filter) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    let likeList;
    if (filter === "review") {
      likeList = await reviewDB.getReviewListByLike(
        client,
        req.user.id,
        likeType.REVIEW,
        invisibleUserIds,
      );
      likeList = await Promise.all(
        likeList.map(async (review) => {
          // 게시글 작성자 정보
          const writer = await userDB.getUserByUserId(client, review.writerId);

          // 태그 정보
          const tagNameList = await relationReviewTagDB.getTagNameListByReviewId(client, review.id);

          // 좋아요 정보
          const likeCount = await likeDB.getLikeCountByTarget(client, review.id, likeType.REVIEW);

          return {
            id: review.id,
            title: review.oneLineReview,
            createdAt: review.createdAt,
            tagList: tagNameList,
            writer: {
              writerId: writer.id,
              nickname: writer.nickname,
            },
            like: {
              isLiked: true, // 좋아요 목록이므로 모두 true
              likeCount: likeCount.likeCount,
            },
          };
        }),
      );
    } else {
      let postTypeIds;
      if (filter === "questionToPerson") {
        postTypeIds = [postType.QUESTION_TO_PERSON];
      } else if (filter === "community") {
        postTypeIds = [postType.GENERAL, postType.INFORMATION, postType.QUESTION_TO_EVERYONE];
      } else {
        return res
          .status(statusCode.BAD_REQUEST)
          .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_TYPE));
      }

      likeList = await postDB.getPostListByLike(
        client,
        req.user.id,
        likeType.POST,
        postTypeIds,
        invisibleUserIds,
      );
      likeList = await Promise.all(
        likeList.map(async (post) => {
          // 댓글 개수
          const commentCount = await commentDB.getCommentCountByPostId(
            client,
            post.id,
            invisibleUserIds,
          );

          // 좋아요 정보
          const likeCount = await likeDB.getLikeCountByTarget(client, post.id, likeType.POST);

          return {
            id: post.id,
            postTypeId: post.postTypeId,
            title: post.title,
            content: post.content,
            majorName: post.majorName,
            createdAt: post.createdAt,
            commentCount: commentCount.commentCount,
            like: {
              isLiked: true, // 좋아요 목록이므로 모두 true
              likeCount: likeCount.likeCount,
            },
          };
        }),
      );
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, { likeList }));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
