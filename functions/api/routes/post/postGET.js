const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, commentDB, blockDB } = require("../../../db");
const { postType, likeType } = require("../../../constants/type");
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

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    const post = await postDB.getPostDetailByPostId(
      client,
      postId,
      req.user.id,
      likeType.POST,
      invisibleUserIds,
    );

    if (!post) {
      return res
        .status(statusCode.NOT_FOUND)
        .send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_POST));
    }

    // post 댓글 리스트 - 삭제 댓글 포함
    let commentList = await commentDB.getCommentListByPostId(client, post.id, invisibleUserIds);

    commentList = commentList.map((comment) => {
      const content = comment.isDeleted ? "(삭제된 답글입니다.)" : comment.content;

      return {
        id: comment.id,
        content: content,
        createdAt: comment.createdAt,
        isDeleted: comment.isDeleted,
        writer: {
          id: comment.writerId,
          isPostWriter: comment.writerId === post.writerId,
          profileImageId: comment.profileImageId,
          nickname: comment.nickname,
          firstMajorName: comment.firstMajorName,
          firstMajorStart: comment.firstMajorStart,
          secondMajorName: comment.secondMajorName,
          secondMajorStart: comment.secondMajorStart,
        },
      };
    });

    let type;
    switch (post.postTypeId) {
      case postType.GENERAL:
        type = "자유";
        break;
      case postType.QUESTION_TO_EVERYONE:
        type = "질문";
        break;
      case postType.INFORMATION:
        type = "정보";
        break;
    }

    res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.READ_ONE_POST_SUCCESS, {
        post: {
          id: post.id,
          type: type,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          majorName: post.majorName,
        },
        writer: {
          id: post.writerId,
          profileImageId: post.profileImageId,
          nickname: post.nickname,
          firstMajorName: post.firstMajorName,
          firstMajorStart: post.firstMajorStart,
          secondMajorName: post.secondMajorName,
          secondMajorStart: post.secondMajorStart,
        },
        // 1:1 하단 플로팅 버튼을 위한 권한 확인
        isAuthorized: req.user.id == post.writerId || req.user.id == post.answererId,
        like: {
          isLiked: post.isLiked,
          likeCount: post.likeCount,
        },
        commentCount: post.commentCount,
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
