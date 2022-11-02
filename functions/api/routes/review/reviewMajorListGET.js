const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewDB, relationReviewTagDB, blockDB } = require("../../../db");
const { likeType } = require("../../../constants/type");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { majorId } = req.params;
  const { sort, tagFilter, writerFilter } = req.query;

  if (!majorId || !writerFilter || !tagFilter || !sort) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    const [invisibleUserList, relationReviewTagList] = await Promise.all([
      blockDB.getInvisibleUserListByUserId(client, req.user.id),
      relationReviewTagDB.getRelationReviewTagList(client),
    ]);

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    let isFirstMajor;
    if (writerFilter === "all") {
      isFirstMajor = [true, false];
    } else if (writerFilter === "firstMajor") {
      isFirstMajor = [true];
    } else if (writerFilter === "secondMajor") {
      isFirstMajor = [false];
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_FILTER));
    }

    let reviewList = await reviewDB.getReviewListByFilters(
      client,
      majorId,
      isFirstMajor,
      tagFilter,
      invisibleUserIds,
      likeType.REVIEW,
      req.user.id,
    );

    reviewList = reviewList.map((review) => {
      // 태그 정보
      review.tagList = _.filter(relationReviewTagList, (r) => r.reviewId === review.id).map((r) => {
        return { tagName: r.tagName };
      });

      return {
        id: review.id,
        oneLineReview: review.oneLineReview,
        createdAt: review.createdAt,
        writer: {
          writerId: review.writerId,
          profileImageId: review.profileImageId,
          nickname: review.nickname,
          firstMajorName: review.firstMajorName,
          firstMajorStart: review.firstMajorStart,
          secondMajorName: review.secondMajorName,
          secondMajorStart: review.secondMajorStart,
        },
        tagList: review.tagList,
        like: {
          isLiked: review.isLiked,
          likeCount: review.likeCount,
        },
      };
    });

    if (sort === "recent") {
      reviewList = _.sortBy(reviewList, "createdAt").reverse();
    } else if (sort === "like") {
      reviewList = _.sortBy(reviewList, ["like.likeCount", "like.isLiked"]).reverse();
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_SORT));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, reviewList));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
