const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createComment = async (client, postId, writerId, content) => {
  const { rows } = await client.query(
    `
      INSERT INTO comment
      (post_id,writer_id ,content)
      VALUES
      ($1, $2, $3)
      RETURNING *
      `,
    [postId, writerId, content],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

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
    SELECT cast(count(*) as integer) AS comment_count FROM comment
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
      ORDER BY created_at
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

const getClassroomPostListByMyCommentList = async (client, commentWriterId, postTypeId) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.writer_id, p.title, p.content, p.created_at
    FROM (SELECT DISTINCT post_id FROM comment WHERE writer_id = $1 AND is_deleted = false) AS c 
    INNER JOIN classroom_post AS p
    ON c.post_id = p.id 
    AND p.writer_id != $1
    AND p.post_type_id = $2
    AND p.is_deleted = false;
      `,
    [commentWriterId, postTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  createComment,
  getCommentCountByPostId,
  getCommentListByPostId,
  getCommentByCommentId,
  getClassroomPostListByMyCommentList,
  updateCommentByReport,
  updateComment,
  deleteCommentByCommentId,
  deleteCommentByPostId,
};
