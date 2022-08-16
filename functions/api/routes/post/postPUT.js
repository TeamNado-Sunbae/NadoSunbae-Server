const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB } = require("../../../db");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { postId } = req.params;
  const { title, content } = req.body;

  if (!postId || !title || !content) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 해당 글이 있는지 확인
    const post = await postDB.getPostByPostId(client, postId);
    if (!post) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    // 수정하려는 유저와 작성자 정보가 일치하는지 확인
    if (post.writerId !== req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
    }

    const updatedPost = await postDB.updatePost(client, title, content, postId);

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.UPDATE_ONE_POST_SUCCESS, {
        post: {
          id: updatedPost.id,
          title: updatedPost.title,
          content: updatedPost.content,
          createdAt: updatedPost.createdAt,
          updatedAt: updatedPost.updatedAt,
        },
        writer: {
          id: req.user.id,
          profileImageId: req.user.profileImageId,
          nickname: req.user.nickname,
          firstMajorName: req.user.firstMajorName,
          firstMajorStart: req.user.firstMajorStart,
          secondMajorName: req.user.secondMajorName,
          secondMajorStart: req.user.secondMajorStart,
        },
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
