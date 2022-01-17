const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, userDB, majorDB, likeDB, commentDB } = require("../../../db");

module.exports = async (req, res) => {
  const { postId } = req.params;
  const { title, content } = req.body;

  if (!postId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  if (!title || !content) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    // 해당 글이 있는지 확인
    const classroomPost = await classroomPostDB.getClassroomPostByPostId(client, postId);
    if (!classroomPost) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    // 수정하려는 유저와 작성자 정보가 일치하는지 확인
    if (classroomPost.writerId !== req.user.id) {
      return res
        .status(statusCode.FORBIDDEN)
        .send(util.fail(statusCode.FORBIDDEN, responseMessage.FORBIDDEN_ACCESS));
    }

    // 과방글 수정
    let updatedClassroomPost = await classroomPostDB.updateClassroomPost(
      client,
      title,
      content,
      postId,
    );

    // 작성자 정보 가져오기
    let writer = await userDB.getUserByUserId(client, updatedClassroomPost.writerId);
    const firstMajorName = await majorDB.getMajorNameByMajorId(client, writer.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, writer.secondMajorId);

    const post = {
      postId: updatedClassroomPost.id,
      title: updatedClassroomPost.title,
      content: updatedClassroomPost.content,
      createdAt: updatedClassroomPost.createdAt,
      updatedAt: updatedClassroomPost.updatedAt,
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

    // 좋아요 수
    const likeCount = await likeDB.getLikeCountByPostId(
      client,
      postId,
      updatedClassroomPost.postTypeId,
    );
    // 좋아요 상태
    let likeStatus = await likeDB.getLikeByPostId(
      client,
      postId,
      updatedClassroomPost.postTypeId,
      req.user.id,
    );
    if (!likeStatus) {
      likeStatus = false;
    } else {
      likeStatus = likeStatus.isLiked;
    }

    // post 댓글 정보

    // post 댓글 개수
    const commentCount = await commentDB.getCommentCountByPostId(client, postId);

    // post 댓글 리스트 - 삭제 댓글 포함
    let commentList = await commentDB.getCommentListByPostId(client, postId);

    commentList = await Promise.all(
      commentList.map(async (comment) => {
        let commentWriter = await userDB.getUserByUserId(client, comment.writerId);
        const firstMajorName = await majorDB.getMajorNameByMajorId(
          client,
          commentWriter.firstMajorId,
        );
        const secondMajorName = await majorDB.getMajorNameByMajorId(
          client,
          commentWriter.secondMajorId,
        );

        commentWriter = {
          writerId: commentWriter.id,
          profileImageId: commentWriter.profileImageId,
          nickname: commentWriter.nickname,
          firstMajorName: firstMajorName.majorName,
          firstMajorStart: commentWriter.firstMajorStart,
          secondMajorName: secondMajorName.majorName,
          secondMajorStart: commentWriter.secondMajorStart,
          isPostWriter: commentWriter.id === classroomPost.writerId,
        };

        return {
          commentId: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          isDeleted: comment.isDeleted,
          writer: commentWriter,
        };
      }),
    );

    updatedClassroomPost = {
      post: post,
      writer: writer,
      like: { isLiked: likeStatus, likeCount: likeCount.likeCount },
      commentCount: commentCount.commentCount,
      commentList: commentList,
    };

    res
      .status(statusCode.OK)
      .send(
        util.success(
          statusCode.OK,
          responseMessage.UPDATE_ONE_COMMENT_SUCCESS,
          updatedClassroomPost,
        ),
      );
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