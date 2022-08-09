const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, blockDB } = require("../../../db");
const { likeType } = require("../../../constants/type");
const errorHandlers = require("../../../lib/errorHandlers");

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

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    let postList = await postDB.getPostListByAnswererId(
      client,
      userId,
      req.user.id,
      likeType.POST,
      invisibleUserIds,
    );

    postList = postList.map((post) => {
      return {
        postId: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        writer: {
          id: post.writerId,
          nickname: post.nickname,
        },
        commentCount: post.commentCount,
        like: {
          isLiked: post.isLiked,
          likeCount: post.likeCount,
        },
      };
    });

    if (sort === "recent") {
      postList = _.sortBy(postList, "createdAt").reverse();
    } else if (sort === "like") {
      postList = _.sortBy(postList, ["like.likeCount", "like.isLiked"]).reverse();
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_SORT));
    }

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
