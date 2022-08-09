const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, likeDB } = require("../../../db");
const slackAPI = require("../../../middlewares/slackAPI");
const { likeType } = require("../../../constants/type");

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
    let post = await postDB.getPostByPostId(client, postId);
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

    // 과방글 수정
    let updatedPost = await postDB.updatePost(client, title, content, postId);

    post = {
      postId: updatedPost.id,
      title: updatedPost.title,
      content: updatedPost.content,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
    };

    const writer = {
      writerId: req.user.id,
      profileImageId: req.user.profileImageId,
      nickname: req.user.nickname,
      firstMajorName: req.user.firstMajorName,
      firstMajorStart: req.user.firstMajorStart,
      secondMajorName: req.user.secondMajorName,
      secondMajorStart: req.user.secondMajorStart,
    };

    // 좋아요 수
    const likeCount = await likeDB.getLikeCountByTarget(client, postId, likeType.POST);
    // 좋아요 상태
    const likeStatus = await likeDB.getLikeByTarget(client, postId, likeType.POST, req.user.id);

    const isLiked = likeStatus ? likeStatus.isLiked : false;

    updatedPost = {
      post: post,
      writer: writer,
      like: { isLiked: isLiked, likeCount: likeCount.likeCount },
    };

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.UPDATE_ONE_POST_SUCCESS, updatedPost));
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
