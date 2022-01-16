const _ = require("lodash");
const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, likeDB, userDB, postTypeDB, commentDB } = require("../../../db");

module.exports = async (req, res) => {
  const { userId } = req.params;
  const { sort } = req.query;

  if (!userId || !sort) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let classroomPostList = await classroomPostDB.getClassroomPostListByUserId(client, userId);

    // classroomPostList에 작성자 정보와 댓글 개수, 좋아요 개수를 붙임
    classroomPostList = await Promise.all(
      classroomPostList.map(async (classroomPost) => {
        let writer = await userDB.getUserByUserId(client, classroomPost.writerId);
        // 작성자 정보
        writer = {
          writerId: writer.id,
          profileImageId: writer.profileImageId,
          nickname: writer.nickname,
        };

        // 댓글 개수
        const commentCount = await commentDB.getCommentCountByPostId(client, classroomPost.id);

        // 좋아요 개수
        const questionToPersonPostType = await postTypeDB.getPostTypeIdByPostTypeName(
          client,
          "questionToPerson",
        );

        const likeCount = await likeDB.getLikeCountByPostId(
          client,
          classroomPost.id,
          questionToPersonPostType.id,
        );

        return {
          postId: classroomPost.id,
          title: classroomPost.title,
          content: classroomPost.content,
          createdAt: classroomPost.createdAt,
          writer: writer,
          commentCount: commentCount.commentCount,
          likeCount: likeCount.likeCount,
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
