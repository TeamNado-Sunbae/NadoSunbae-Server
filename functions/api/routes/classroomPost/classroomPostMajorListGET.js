const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, userDB, likeDB, commentDB } = require("../../../db");

module.exports = async (req, res) => {
  const { postTypeId, majorId } = req.params;
  const { sort } = req.query;

  if (!postTypeId || !majorId || !sort) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  if (postTypeId !== 2 || postTypeId !== 3 || postTypeId !== 4) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_POSTTYPEID));
  }

  let client;

  try {
    client = await db.connect(req);

    let classroomPostList = await classroomPostDB.getClassroomPostListByMajorId(
      client,
      majorId,
      postTypeId,
    );

    // 해당 과에 정보 또는 질문 글이 없을 경우
    if (classroomPostList.length === 0) {
      return res
        .status(statusCode.OK)
        .send(util.success(statusCode.OK, responseMessage.NO_CONTENT, classroomPostList));
    }

    classroomPostList = await Promise.all(
      classroomPostList.map(async (classroomPost) => {
        let writer = await userDB.getUserByUserId(client, classroomPost.writerId);

        writer = {
          writerId: writer.id,
          profileImageId: writer.profileImageId,
          nickname: writer.nickname,
        };

        const likeCount = await likeDB.getLikeCountByPostId(client, classroomPost.id, postTypeId);
        const commentCount = await commentDB.getCommentCountByPostId(client, classroomPost.id);

        return {
          postId: classroomPost.id,
          title: classroomPost.title,
          content: classroomPost.content,
          createdAt: classroomPost.createdAt,
          writer: writer,
          likeCount: likeCount.likeCount,
          commentCount: commentCount.count,
        };
      }),
    );

    if (sort === "recent") {
      classroomPostList = _.sortBy(classroomPostList, "createdAt").reverse();
    } else if (sort === "like") {
      classroomPostList = _.sortBy(classroomPostList, "likeCount").reverse();
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_SORT));
    }

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, classroomPostList));
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
