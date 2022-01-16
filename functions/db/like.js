const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getLikeCountByPostId = async (client, postId, postTypeId) => {
  const { rows } = await client.query(
    `
        SELECT count(*) AS like_count FROM "like"
        WHERE post_id = $1 
        AND post_type_id = $2
        AND is_liked = true
        `,
    [postId, postTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getLikeByPostId = async (client, postId, postTypeId, userId) => {
  const { rows } = await client.query(
    `
          SELECT * FROM "like"
          WHERE post_id = $1 
          AND post_type_id = $2 
          AND user_id = $3
          `,
    [postId, postTypeId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getLikeCountByPostId,
  getLikeByPostId,
};
