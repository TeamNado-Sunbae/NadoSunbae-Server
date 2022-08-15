const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, blockDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { majorId } = req.params;
  const { exclude } = req.query;

  if (!majorId) {
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

    // 본인은 선배 리스트에 보이지 않도록
    invisibleUserIds.push(req.user.id);

    const isReviewed = exclude === "noReview" ? [true] : [true, false];

    const userList = await userDB.getUserListByMajorId(
      client,
      majorId,
      isReviewed,
      invisibleUserIds,
    );

    const [onQuestionUserList, offQuestionUserList] = _.partition(userList, (u) => u.isOnQuestion);

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ALL_USERS_SUCCESS, {
        onQuestionUserList,
        offQuestionUserList,
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
