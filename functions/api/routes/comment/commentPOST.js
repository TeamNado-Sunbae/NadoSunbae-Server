const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { commentDB, userDB, majorDB, classroomPostDB } = require("../../../db");

module.exports = async (req, res) => {
  const { postId, content } = req.body;

  if (!postId || !content) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);
    const commentWriterId = req.user.id;

    // 1대 1 질문글인 경우
    // 원글 작성자와 답변자만 댓글 등록 가능
    const postData = await classroomPostDB.getClassroomPostByPostId(client, postId);
    if (!postData) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }
    if (postData.postTypeId === 4) {
      if (postData.writerId !== commentWriterId && postData.answererId !== commentWriterId) {
        return res
          .status(statusCode.FORBIDDEN)
          .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
      }
    }

    // 댓글 등록
    let comment = await commentDB.createComment(client, postId, commentWriterId, content);

    // 댓글 작성자 정보 가져오기
    let writer = await userDB.getUserByUserId(client, commentWriterId);
    const firstMajorName = await majorDB.getMajorNameByMajorId(client, writer.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, writer.secondMajorId);

    writer = {
      WriterId: writer.id,
      profileImageId: writer.profileImageId,
      nickname: writer.nickname,
      firstMajorName: firstMajorName.majorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: secondMajorName.majorName,
      secondMajorStart: writer.secondMajorStart,
    };

    comment = {
      commentId: comment.id,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt,
      isDeleted: comment.isDeleted,
      writer: writer,
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.CREATE_ONE_COMMENT_SUCCESS, comment));
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
