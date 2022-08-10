const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, likeDB, reviewDB, blockDB, postDB } = require("../../../db");
const { likeType } = require("../../../constants/type");
const errorHandlers = require("../../../lib/errorHandlers");
const { response } = require("express");

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

    const [user, responseRate] = await Promise.all([
      userDB.getUserByUserId(client, userId),
      postDB.calculateResponseRate(client, userId),
    ]);

    if (!user) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
    }

    // if my page, count is like count
    // else other page, count is review count
    let count;
    if (userId == req.user.id) {
      // 내가 차단한 사람과 나를 차단한 사람을 block
      const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
      const invisibleUserIds = _.map(invisibleUserList, "userId");

      const likeCount = await likeDB.getLikeCountByUserId(
        client,
        likeType.REVIEW,
        likeType.POST,
        user.id,
        invisibleUserIds,
      );
      count = likeCount.likeCount;
    } else {
      const reviewCount = await reviewDB.getReviewCountByUserId(client, user.id);
      count = reviewCount.count;
    }

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ONE_USER_SUCCESS, {
        userId: user.id,
        isOnQuestion: user.isOnQuestion,
        profileImageId: user.profileImageId,
        nickname: user.nickname,
        responseRate: responseRate ? responseRate.rate : null,
        bio: user.bio,
        firstMajorName: user.firstMajorName,
        firstMajorStart: user.firstMajorStart,
        secondMajorName: user.secondMajorName,
        secondMajorStart: user.secondMajorStart,
        count: count,
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
