const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, majorDB } = require("../../../db");

module.exports = async (req, res) => {
  const { majorId, answererId, postTypeId, title, content } = req.body;
  let writer = req.user;

  if (!majorId || !postTypeId || !title || !content) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  if (postTypeId === 4) {
    if (!answererId) {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
    }
  }

  if (writer.isReviewed === false) {
    return res
      .status(statusCode.FORBIDDEN)
      .send(util.fail(statusCode.FORBIDDEN, responseMessage.IS_REVIEWED_FALSE));
  }

  let client;

  try {
    client = await db.connect(req);
    let post = await classroomPostDB.createClassroomPost(
      client,
      majorId,
      writer.id,
      answererId,
      postTypeId,
      title,
      content,
    );

    const firstMajorName = await majorDB.getMajorNameByMajorId(client, writer.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, writer.secondMajorId);

    post = {
      postId: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
    };

    writer = {
      writerId: writer.id,
      profileImageId: writer.profileImageId,
      nickname: writer.nickname,
      firstMajorName: firstMajorName.majorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: secondMajorName.majorName,
      secondMajorStart: writer.secondMajorStart,
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.CREATE_ONE_POST_SUCCESS, { post, writer }));
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
