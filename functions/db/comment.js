const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const updateCommentByReport = async (client, commentId) => {
  const { rows: existingRows } = await client.query(
    `
      SELECT * FROM "comment"
      WHERE id = $1
      AND is_deleted = FALSE
      `,
    [commentId],
  );

  if (existingRows.length === 0) return false;

  const { rows } = await client.query(
    `
      UPDATE "comment"
      SET report_count = report_count + 1, updated_at = now()
      WHERE id = $1     
      AND is_deleted = FALSE
      RETURNING *
      `,
    [commentId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

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

module.exports = { getCommentCountByPostId, getCommentListByPostId, updateCommentByReport };
