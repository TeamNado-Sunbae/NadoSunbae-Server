const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, commentDB } = require("../../../db");

module.exports = async (req, res) => {
  const { postId } = req.params;

  if (!postId)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    // 삭제하려는 유저와 게시글의 작성자가 같은지 확인
    let post = await classroomPostDB.getClassroomPostByPostId(client, postId);
    console.log(post);
    if (!post) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }
    // 같지 않을 경우 403 FORBIDDEN Error
    if (post.writerId !== req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
    }

    // 게시글 삭제
    let deletedPost = await classroomPostDB.deleteClassroomPostByPostId(client, postId);

    if (!deletedPost) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    // 관련된 댓글 삭제
    const deletedComment = await commentDB.deleteCommentByPostId(client, postId);

    if (!deletedComment) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_COMMENT));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.DELETE_ONE_POST_SUCCESS, deletedPost));
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
