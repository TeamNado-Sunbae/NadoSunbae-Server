const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, likeDB, commentDB, blockDB } = require("../../../db");
const { postType, likeType } = require("../../../constants/type");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { filter } = req.query;

  if (!filter) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let postTypeIds;
    if (filter === "questionToPerson") {
      postTypeIds = [postType.QUESTION_TO_PERSON];
    } else if (filter === "community") {
      postTypeIds = [postType.GENERAL, postType.INFORMATION, postType.QUESTION_TO_EVERYONE];
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_FILTER));
    }

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    let postList = await postDB.getMyPostListByPostTypeIds(client, req.user.id, postTypeIds);
    postList = await Promise.all(
      postList.map(async (post) => {
        // 댓글 개수
        const commentCount = await commentDB.getCommentCountByPostId(
          client,
          post.id,
          invisibleUserIds,
        );

        // 좋아요 정보
        const likeData = await likeDB.getLikeByTarget(client, post.id, likeType.POST, req.user.id);
        const isLiked = likeData ? likeData.isLiked : false;
        const likeCount = await likeDB.getLikeCountByTarget(client, post.id, likeType.POST);

        return {
          postId: post.id,
          postTypeId: post.postTypeId,
          title: post.title,
          content: post.content,
          majorName: post.majorName,
          createdAt: post.createdAt,
          commentCount: commentCount.commentCount,
          like: {
            isLiked: isLiked,
            likeCount: likeCount.likeCount,
          },
        };
      }),
    );

    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, { postList }));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
