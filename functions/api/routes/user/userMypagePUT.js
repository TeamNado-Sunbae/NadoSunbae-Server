const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { nickname, firstMajorId, firstMajorStart, secondMajorId, secondMajorStart, isOnQuestion } =
    req.body;

  if (
    !nickname ||
    !firstMajorId ||
    !firstMajorStart ||
    !secondMajorId ||
    !secondMajorStart ||
    (typeof isOnQuestion !== "boolean" && !isOnQuestion)
  ) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 닉네임 변경했을 때만 nickname_updated_at 업데이트
    const isNicknameUpdated = req.user.nickname !== nickname ? true : false;

    if (isNicknameUpdated) {
      // 닉네임 중복 확인
      const existingUser = await userDB.getUserByNickname(client, nickname);
      if (existingUser) {
        return res
          .status(statusCode.CONFLICT)
          .send(util.fail(statusCode.CONFLICT, responseMessage.ALREADY_NICKNAME));
      }
    }

    // 유저 정보 수정
    let updatedUser = await userDB.updateUserByMypage(
      client,
      req.user.id,
      nickname,
      firstMajorId,
      firstMajorStart,
      secondMajorId,
      secondMajorStart,
      isOnQuestion,
      isNicknameUpdated,
    );

    updatedUser = {
      nickname: updatedUser.nickname,
      firstMajorId: updatedUser.firstMajorId,
      firstMajorStart: updatedUser.firstMajorStart,
      secondMajorId: updatedUser.secondMajorId,
      secondMajorStart: updatedUser.secondMajorStart,
      isOnQuestion: updatedUser.isOnQuestion,
      updatedAt: updatedUser.updatedAt,
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.UPDATE_ONE_USER_SUCCESS, updatedUser));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
