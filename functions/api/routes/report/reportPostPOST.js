const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, reviewPostDB } = require("../../../db");

module.exports = async (req, res) => {
  const { postId, postTypeId } = req.body;

  if (!postId || !postTypeId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let updatePost;

    if (postTypeId === 1) {
      // 신고한 게시글이 후기글일 때
      updatePost = await reviewPostDB.updatePostByReport(client, postId);
    } else {
      // 신고한 게시글이 과방글일 때 (이때는 postTypeId도 같이 넘겨줘야 함)
      updatePost = await classroomPostDB.updatePostByReport(client, postId, postTypeId);
    }

    if (!updatePost) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.REPORT_SUCCESS, updatePost));
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
