const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const updateComment = async (client, commentId, content) => {
  const { rows: existingRows } = await client.query(
    `
      SELECT * FROM comment
      WHERE id = $1
      AND is_deleted = FALSE
      `,
    [commentId],
  );

  if (existingRows.length === 0) return false;
  const data = _.merge({}, convertSnakeToCamel.keysToCamel(existingRows[0]), {
    content,
  });

  const { rows } = await client.query(
    `
      UPDATE comment
      SET content = $1, updated_at = now()
      WHERE id = $2
      AND is_deleted = FALSE
      RETURNING * 
      `,
    [data.content, commentId],
    );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

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

const deleteCommentByPostId = async (client, postId) => {
  const { rows: existingRows } = await client.query(
    `
      SELECT * FROM comment 
      WHERE post_id = $1
         AND is_deleted = FALSE
      `,
    [postId],
  );

  if (existingRows.length === 0) return true;

  const { rows } = await client.query(
    `
      UPDATE comment 
      SET is_deleted = TRUE, updated_at = now()
      WHERE post_id = $1
      RETURNING *
      `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getCommentByCommentId = async (client, commentId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM comment
      WHERE id = $1
      AND is_deleted = FALSE
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
  updateComment,
  updateCommentByReport,
  getCommentCountByPostId,
  getCommentListByPostId,
  getCommentByCommentId,
  deleteCommentByCommentId,
  deleteCommentByPostId,
};
