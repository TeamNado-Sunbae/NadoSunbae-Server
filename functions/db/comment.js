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
      AND is_deleted = false
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
      AND is_deleted = false
      RETURNING * 
      `,
    [data.content, commentId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getCommentCountByPostId = async (client, postId, invisibleUserIds) => {
  const { rows } = await client.query(
    `
    SELECT cast(count(*) as integer) AS comment_count FROM comment
    WHERE post_id = $1
    AND writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    AND is_deleted = false
    `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getCommentListByPostId = async (client, postId, invisibleUserIds) => {
  const { rows } = await client.query(
    `
      SELECT c.id, c.content, c.created_at, c.is_deleted,
      c.writer_id, u.profile_image_id, u.nickname, u.first_major_start, u.second_major_start, m1.major_name first_major_name, m2.major_name second_major_name
      FROM comment c
      INNER JOIN "user" u
        ON c.writer_id = u.id
        AND u.is_deleted = false
      INNER JOIN major m1
        ON u.first_major_id = m1.id
        AND u.is_deleted = false
        AND m1.is_deleted = false
      INNER JOIN major m2
        ON u.second_major_id = m2.id
        AND u.is_deleted = false
        AND m2.is_deleted = false
      WHERE c.post_id = $1
      AND c.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
      ORDER BY c.created_at
      `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteCommentListByPostId = async (client, postId) => {
  const { rows: existingRows } = await client.query(
    `
      SELECT * FROM comment 
      WHERE post_id = $1
         AND is_deleted = false
      `,
    [postId],
  );

  if (existingRows.length === 0) return true;

  const { rows } = await client.query(
    `
      UPDATE comment 
      SET is_deleted = true, updated_at = now()
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
      AND is_deleted = false
      `,
    [commentId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getCommentListByNotification = async (client) => {
  const { rows } = await client.query(
    `
      SELECT c.id, c.is_deleted
      FROM comment c
      INNER JOIN "user" u
      ON c.writer_id = u.id
      AND u.is_deleted = false
      `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteCommentByCommentId = async (client, commentId) => {
  const { rows } = await client.query(
    `
    UPDATE comment
    SET is_deleted = true, updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING id as comment_id, is_deleted
    `,
    [commentId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteCommentListByUserSecession = async (client, writerId) => {
  const { rows } = await client.query(
    `
    UPDATE comment
    SET is_deleted = true, updated_at = now()
    WHERE writer_id = $1
    AND is_deleted = false
    RETURNING id, is_deleted, updated_at
    `,
    [writerId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  createComment,
  getCommentCountByPostId,
  getCommentListByPostId,
  getCommentByCommentId,
  updateComment,
  deleteCommentByCommentId,
  deleteCommentListByPostId,
  deleteCommentListByUserSecession,
  getCommentListByNotification,
};
