const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { userDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const {
    profileImageId,
    nickname,
    bio,
    isOnQuestion,
    firstMajorId,
    firstMajorStart,
    secondMajorId,
    secondMajorStart,
  } = req.body;

  if (
    !profileImageId ||
    !nickname ||
    !firstMajorId ||
    !firstMajorStart ||
    !secondMajorId ||
    !secondMajorStart ||
    (!isOnQuestion && typeof isOnQuestion !== "boolean")
  ) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 닉네임 변경 여부
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

    const updatedUser = await userDB.updateUser(
      client,
      req.user.id,
      profileImageId,
      nickname,
      bio,
      isOnQuestion,
      firstMajorId,
      firstMajorStart,
      secondMajorId,
      secondMajorStart,
      isNicknameUpdated,
    );

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.UPDATE_ONE_USER_SUCCESS, {
        profileImageId: updatedUser.profileImageId,
        nickname: updatedUser.nickname,
        bio: updatedUser.bio,
        isOnQuestion: updatedUser.isOnQuestion,
        firstMajorId: updatedUser.firstMajorId,
        firstMajorStart: updatedUser.firstMajorStart,
        secondMajorId: updatedUser.secondMajorId,
        secondMajorStart: updatedUser.secondMajorStart,
        updatedAt: updatedUser.updatedAt,
        nicknameUpdatedAt: updatedUser.nicknameUpdatedAt,
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
