const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { classroomPostDB, userDB, majorDB, likeDB, postTypeDB, commentDB } = require("../../../db");

module.exports = async (req, res) => {
  const { postId } = req.params;
  if (!postId)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  // 후기 미작성자는 정보글 상세조회 불가
  if (req.user.isReviewed === false) {
    return res
      .status(statusCode.FORBIDDEN)
      .send(util.fail(statusCode.FORBIDDEN, responseMessage.IS_REVIEWED_FALSE));
  }

  let client;

  try {
    client = await db.connect(req);

    let classroomPost = await classroomPostDB.getClassroomPostByPostId(client, postId);
    if (!classroomPost) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }
    // questioner, answerer 정보
    const questionerId = classroomPost.writerId;
    const answererId = classroomPost.answererId;

    // post 좋아요 정보

    // postType을 알아야 함
    const questionToEveryonePostTypeId = await postTypeDB.getPostTypeIdByPostTypeName(
      client,
      "questionToEveryone",
    );

    const questionToPersonPostTypeId = await postTypeDB.getPostTypeIdByPostTypeName(
      client,
      "questionToPerson",
    );

    // 로그인 유저가 좋아요한 상태인지
    const requestUser = req.user;

    // 1:1 질문인지, 전체 질문인지
    let postTypeId;

    // answererId 없을 때는 전체 질문
    if (!classroomPost.answererId) {
      postTypeId = questionToEveryonePostTypeId.id;
    } else {
      postTypeId = questionToPersonPostTypeId.id;
    }

    let like = await likeDB.getLikeByPostId(client, classroomPost.id, postTypeId, requestUser.id);
    let isLiked;
    if (!like) {
      isLiked = false;
    } else {
      isLiked = like.isLiked;
    }

    // post 좋아요 개수
    const likeCount = await likeDB.getLikeCountByPostId(client, classroomPost.id, postTypeId);

    like = {
      isLiked: isLiked,
      likeCount: likeCount.likeCount,
    };

    // post 작성자 정보
    let writer = await userDB.getUserByUserId(client, classroomPost.writerId);
    const firstMajorName = await majorDB.getMajorNameByMajorId(client, writer.firstMajorId);
    const secondMajorName = await majorDB.getMajorNameByMajorId(client, writer.secondMajorId);

    writer = {
      writerId: writer.id,
      profileImageId: writer.profileImageId,
      isQuestioner: true,
      nickname: writer.nickname,
      firstMajorName: firstMajorName.majorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: secondMajorName.majorName,
      secondMajorStart: writer.secondMajorStart,
    };

    // post 정보
    const post = {
      messageId: classroomPost.id,
      title: classroomPost.title,
      content: classroomPost.content,
      createdAt: classroomPost.createdAt,
      isDeleted: classroomPost.isDeleted,
      writer: writer,
    };

    // post 댓글 정보

    // post 댓글 리스트 - 삭제 댓글 포함
    let messageList = await commentDB.getCommentListByPostId(client, classroomPost.id);

    messageList = await Promise.all(
      messageList.map(async (comment) => {
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
          isQuestioner: commentWriter.id === classroomPost.writerId,
          nickname: commentWriter.nickname,
          firstMajorName: firstMajorName.majorName,
          firstMajorStart: commentWriter.firstMajorStart,
          secondMajorName: secondMajorName.majorName,
          secondMajorStart: commentWriter.secondMajorStart,
        };

        return {
          messageId: comment.id,
          title: "",
          content: comment.content,
          createdAt: comment.createdAt,
          isDeleted: comment.isDeleted,
          writer: commentWriter,
        };
      }),
    );

    messageList.unshift(post);

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ONE_POST_SUCCESS, {
        questionerId,
        answererId,
        like,
        messageList,
      }),
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