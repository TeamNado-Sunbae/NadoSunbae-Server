const _ = require("lodash");
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

const getCommentListByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM comment
      WHERE post_id = $1
      `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getCommentCountByPostId, getCommentListByPostId };
