const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB, blockDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");

module.exports = async (req, res) => {
  const { majorId } = req.params;

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

    // get userList
    let userList = await userDB.getUsersByMajorId(client, majorId, invisibleUserIds);

    // userList를 랜덤으로 섞기
    userList = _.shuffle(userList);

    // user의 fist_major_id가 majorId와 같으면 isFirstMajor true,
    // second_major_id가 majorId와 같으면 isFirstMajor false
    let isFirstMajor;
    let majorStart;

    userList = userList.map((user) => {
      if (user.firstMajorId === Number(majorId)) {
        isFirstMajor = true;
        majorStart = user.firstMajorStart;
      } else if (user.secondMajorId === Number(majorId)) {
        isFirstMajor = false;
        majorStart = user.secondMajorStart;
      }

      return {
        userId: user.id,
        profileImageId: user.profileImageId,
        isOnQuestion: user.isOnQuestion,
        nickname: user.nickname,
        isFirstMajor: isFirstMajor,
        majorStart: majorStart,
      };
    });

    // 질문 알림 여부에 따라 두 그룹으로 나누어 response 보냄
    let onQuestionUserList = [];
    let offQuestionUserList = [];

    userList.map((user) => {
      return (user.isOnQuestion === true ? onQuestionUserList : offQuestionUserList).push(user);
    });

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ALL_USERS_SUCCESS, {
        onQuestionUserList,
        offQuestionUserList,
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
