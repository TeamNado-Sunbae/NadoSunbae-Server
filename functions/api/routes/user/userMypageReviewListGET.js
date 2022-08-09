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
    let reviewList = await reviewDB.getReviewListByUserId(client, userId);

    let writer = await userDB.getUserByUserId(client, userId);

    writer = {
      writerId: writer.id,
      nickname: writer.nickname,
    };

    // 해당 유저의 후기글이 하나도 없을 경우
    if (reviewList.length === 0) {
      return res.status(statusCode.OK).send(
        util.success(statusCode.NO_CONTENT, responseMessage.NO_CONTENT, {
          writer,
          reviewList,
        }),
      );
    }

    reviewList = await Promise.all(
      reviewList.map(async (review) => {
        const tagNameList = await relationReviewTagDB.getTagNameListByReviewId(client, review.id);

        // 좋아요 정보
        const likeData = await likeDB.getLikeByTarget(
          client,
          review.id,
          likeType.REVIEW,
          req.user.id,
        );

        const isLiked = likeData ? likeData.isLiked : false;

        const likeCount = await likeDB.getLikeCountByTarget(client, review.id, likeType.REVIEW);
        const like = {
          isLiked: isLiked,
          likeCount: likeCount.likeCount,
        };

        return {
          id: review.id,
          majorName: review.majorName,
          oneLineReview: review.oneLineReview,
          createdAt: review.createdAt,
          tagList: tagNameList,
          like: like,
        };
      }),
    );

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, {
        writer,
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
