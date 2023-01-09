const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { reviewDB, likeDB, relationReviewTagDB, userDB } = require("../../../db");
const { likeType } = require("../../../constants/type");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);
    const [writer, relationReviewTagList] = await Promise.all([
      userDB.getUserByUserId(client, userId),
      relationReviewTagDB.getRelationReviewTagList(client),
    ]);

    let reviewList = await reviewDB.getReviewListByUserId(
      client,
      userId,
      likeType.REVIEW,
      req.user.id,
    );

    reviewList = reviewList.map((review) => {
      review.tagList = _.filter(relationReviewTagList, (r) => r.reviewId === review.id).map((r) => {
        return { tagName: r.tagName };
      });

      return {
        id: review.id,
        majorName: review.majorName,
        oneLineReview: review.oneLineReview,
        createdAt: review.createdAt,
        tagList: review.tagList,
        like: {
          isLiked: review.isLiked,
          likeCount: review.likeCount,
        },
      };
    });

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, {
        writer: {
          writerId: writer.id,
          nickname: writer.nickname,
        },
        reviewList,
      }),
    );
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
