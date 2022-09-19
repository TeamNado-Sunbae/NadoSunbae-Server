const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewDB, relationReviewTagDB, postDB, blockDB } = require("../../../db");
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
      const relationReviewTagList = await relationReviewTagDB.getRelationReviewTagList(client);

      likeList = await reviewDB.getReviewListByLike(
        client,
        req.user.id,
        likeType.REVIEW,
        invisibleUserIds,
      );

      likeList = likeList.map((review) => {
        const tagNameList = _.filter(relationReviewTagList, (r) => r.reviewId === review.id).map(
          (r) => {
            return {
              tagName: r.tagName,
            };
          },
        );

        return {
          id: review.id,
          title: review.oneLineReview,
          createdAt: review.createdAt,
          tagList: tagNameList,
          writer: {
            writerId: review.writerId,
            nickname: review.nickname,
          },
          like: {
            isLiked: true, // 좋아요 목록이므로 모두 true
            likeCount: review.likeCount,
          },
        };
      });
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

      likeList = likeList.map((post) => {
        let type;
        switch (post.postTypeId) {
          case postType.GENERAL:
            type = "자유";
            break;
          case postType.QUESTION_TO_EVERYONE:
            type = "질문";
            break;
          case postType.INFORMATION:
            type = "정보";
            break;
        }

        return {
          id: post.id,
          type: type,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          majorName: post.majorName,
          writer: {
            id: post.writerId,
            nickname: post.nickname,
          },
          commentCount: post.commentCount,
          like: {
            isLiked: true, // 좋아요 목록이므로 모두 true
            likeCount: post.likeCount,
          },
        };
      });
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
