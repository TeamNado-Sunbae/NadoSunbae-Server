const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getCommentCountByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
    SELECT count(*) FROM comment
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

const getCommentByCommentId = async (client, commentId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "comment" c
    WHERE id = $1
    AND is_deleted = false
    `,
    [commentId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteCommentByCommentId = async (client, commentId) => {
  const { rows } = await client.query(
    `
    UPDATE comment
    SET is_deleted = TRUE, updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING id as comment_id, is_deleted
    `,
    [commentId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getCommentCountByPostId,
  getCommentListByPostId,
  getCommentByCommentId,
  deleteCommentByCommentId,
};
