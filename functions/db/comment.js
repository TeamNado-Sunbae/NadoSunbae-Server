const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getCommentCountByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
    SELECT count(*) comment_count FROM comment
    WHERE post_id = $1
    AND is_deleted = false
    `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { getCommentCountByPostId };
