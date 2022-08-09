const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, likeDB, blockDB } = require("../../../db");
const { postType, likeType } = require("../../../constants/type");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { majorId } = req.params;
  const { sort, filter } = req.query;

  if (!filter || !majorId || !sort) {
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

    let postTypeId;
    if (filter === "information") {
      postTypeId = postType.INFORMATION;
    } else if (filter === "questionToEveryone") {
      postTypeId = postType.QUESTION_TO_EVERYONE;
    } else if (filter === "questionToPerson") {
      postTypeId = postType.QUESTION_TO_PERSON;
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_FILTER));
    }

    let postList = await postDB.getPostListByMajorId(
      client,
      majorId,
      postTypeId,
      likeType.POST,
      invisibleUserIds,
    );

    const likeList = await likeDB.getLikeListByUserId(client, req.user.id);

    postList = postList.map((post) => {
      // 좋아요 정보
      const likeData = _.find(likeList, {
        targetId: post.id,
        targetTypeId: likeType.POST,
      });

      const isLiked = likeData ? likeData.isLiked : false;

      return {
        postId: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        writer: {
          writerId: post.writerId,
          profileImageId: post.profileImageId,
          nickname: post.nickname,
        },
        like: {
          isLiked: isLiked,
          likeCount: post.likeCount,
        },
        commentCount: post.commentCount,
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
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_POSTS_SUCCESS, postList));
  } catch (error) {
    errorHandlers.error(req, error);

    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
