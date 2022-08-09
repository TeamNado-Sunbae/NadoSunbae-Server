const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, likeDB, reviewDB, blockDB } = require("../../../db");
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
    let user = await userDB.getUserByUserId(client, userId);

    if (!user) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));
    }

    let count;

    // 본인 마이페이지, 타인 마이페이지 여부에 따라 다른 내용의 count 보냄
    if (Number(userId) === req.user.id) {
      // 좋아요 한 개수

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
      // 작성한 후기글 개수
      const reviewCount = await reviewDB.getReviewCountByUserId(client, user.id);
      count = reviewCount.count;
    }

    user = {
      userId: user.id,
      profileImageId: user.profileImageId,
      nickname: user.nickname,
      firstMajorId: user.firstMajorId,
      firstMajorName: user.firstMajorName,
      firstMajorStart: user.firstMajorStart,
      secondMajorId: user.secondMajorId,
      secondMajorName: user.secondMajorName,
      secondMajorStart: user.secondMajorStart,
      isOnQuestion: user.isOnQuestion,
      count: count,
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ONE_USER_SUCCESS, user));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
