const _ = require("lodash");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { postDB, blockDB } = require("../../../db");
const { postType, likeType } = require("../../../constants/type");
const errorHandlers = require("../../../lib/errorHandlers");

module.exports = async (req, res) => {
  const { universityId } = req.params;
  const { majorId, filter, sort, search } = req.query;

  if (!filter || !sort || !universityId) {
    return res
      .status(statusCode.BAD_REQUEST)
      .send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    let postTypeIds;
    if (filter === "community") {
      postTypeIds = [postType.GENERAL, postType.INFORMATION, postType.QUESTION_TO_EVERYONE];
    } else if (filter === "general") {
      postTypeIds = [postType.GENERAL];
    } else if (filter === "information") {
      postTypeIds = [postType.INFORMATION];
    } else if (filter === "questionToEveryone") {
      postTypeIds = [postType.QUESTION_TO_EVERYONE];
    } else if (filter === "questionToPerson") {
      postTypeIds = [postType.QUESTION_TO_PERSON];
    } else {
      return res
        .status(statusCode.BAD_REQUEST)
        .send(util.fail(statusCode.BAD_REQUEST, responseMessage.INCORRECT_FILTER));
    }

    // 내가 차단한 사람과 나를 차단한 사람을 block
    const invisibleUserList = await blockDB.getInvisibleUserListByUserId(client, req.user.id);
    const invisibleUserIds = _.map(invisibleUserList, "userId");

    let postList = await postDB.getPostList(
      client,
      universityId,
      majorId ? majorId : 0,
      postTypeIds,
      req.user.id,
      likeType.POST,
      search ? search : "",
      invisibleUserIds,
    );

    postList = postList.map((post) => {
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

      return {
        postId: post.id,
        type: type,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        majorName: post.majorName,
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
