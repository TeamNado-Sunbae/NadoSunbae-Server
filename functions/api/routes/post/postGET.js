const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, userDB, likeDB, commentDB, blockDB } = require("../../../db");
const { likeType } = require("../../../constants/type");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { postId } = req.params;
  if (!postId)
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    let post = await postDB.getPostByPostId(client, postId);
    if (!post) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    // post 좋아요 정보

    // 로그인 유저가 좋아요한 상태인지
    const like = await likeDB.getLikeByTarget(client, post.id, likeType.POST, req.user.id);

    const isLiked = like ? like.isLiked : false;

    // post 좋아요 개수
    const likeCount = await likeDB.getLikeCountByTarget(client, post.id, likeType.POST);

    // post 작성자 정보
    let writer = await userDB.getUserByUserId(client, post.writerId);

    writer = {
      isPostWriter: true,
      writerId: writer.id,
      profileImageId: writer.profileImageId,
      nickname: writer.nickname,
      firstMajorName: writer.firstMajorName,
      firstMajorStart: writer.firstMajorStart,
      secondMajorName: writer.secondMajorName,
      secondMajorStart: writer.secondMajorStart,
    };

    // post 정보
    post = {
      postId: post.id,
      answererId: post.answererId,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      isDeleted: post.isDeleted,
    };

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    // post 댓글 정보

    // post 댓글 개수
    const commentCount = await commentDB.getCommentCountByPostId(client, post.id, invisibleUserIds);

    // post 댓글 리스트 - 삭제 댓글 포함
    let commentList = await commentDB.getCommentListByPostId(client, post.id, invisibleUserIds);

    commentList = commentList.map((comment) => {
      const content = comment.isDeleted ? "(삭제된 답글입니다.)" : comment.content;

      const commentWriter = {
        isPostWriter: comment.writerId === post.writerId,
        writerId: comment.writerId,
        profileImageId: comment.profileImageId,
        nickname: comment.nickname,
        firstMajorName: comment.firstMajorName,
        firstMajorStart: comment.firstMajorStart,
        secondMajorName: comment.secondMajorName,
        secondMajorStart: comment.secondMajorStart,
      };

      return {
        commentId: comment.id,
        content: content,
        createdAt: comment.createdAt,
        isDeleted: comment.isDeleted,
        writer: commentWriter,
      };
    });

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ONE_POST_SUCCESS, {
        post,
        writer,
        like: {
          isLiked: isLiked,
          likeCount: likeCount.likeCount,
        },
        commentCount: commentCount.commentCount,
        commentList,
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
