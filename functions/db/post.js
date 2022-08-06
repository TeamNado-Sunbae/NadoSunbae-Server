const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const deletePostByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
      UPDATE post p
      SET is_deleted = true, updated_at = now()
      WHERE id = $1
      RETURNING id as post_id, is_deleted
      `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getPostListByUserId = async (client, userId, invisibleUserIds) => {
  const { rows } = await client.query(
    `
      SELECT * FROM post
      WHERE answerer_id = $1
      AND writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
      AND is_deleted = false
      ORDER BY created_at desc
          `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getPostByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM post 
    WHERE id = $1
      AND is_deleted = false
    `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getPostListByNotification = async (client) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.is_deleted
    FROM post p
    INNER JOIN "user" u
    ON p.writer_id = u.id
    AND u.is_deleted = false
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const createPost = async (client, majorId, writerId, answererId, postTypeId, title, content) => {
  const { rows } = await client.query(
    `
    INSERT INTO post
    (major_id, writer_id ,answerer_id, post_type_id, title, content)
    VALUES
    ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [majorId, writerId, answererId, postTypeId, title, content],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updatePost = async (client, title, content, postId) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM post p
    WHERE id = $1
       AND is_deleted = false
    `,
    [postId],
  );

  if (existingRows.length === 0) return false;

  const data = _.merge({}, convertSnakeToCamel.keysToCamel(existingRows[0]), { title, content });

  const { rows } = await client.query(
    `
    UPDATE post p
    SET title = $1, content = $2, updated_at = now()
    WHERE id = $3
    RETURNING * 
    `,
    [data.title, data.content, postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getPostListByMajorId = async (client, majorId, postTypeId, invisibleUserIds) => {
  const { rows } = await client.query(
    `
  SELECT p.*, u.profile_image_id, u.nickname,
  (
    SELECT cast(count(c.*) as integer) comment_count FROM comment c
    WHERE c.post_id = p.id
    AND c.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    AND c.is_deleted = false
    AND p.is_deleted = false
  ),
  (
    SELECT cast(count(l.*) as integer) AS like_count FROM "like" l
    WHERE l.post_id = p.id
    AND l.post_type_id = $2
    AND l.is_liked = true
    AND p.is_deleted = false
  )
  FROM "post" p
  INNER JOIN "user" u
  ON p.writer_id = u.id
  AND u.is_deleted = false
  AND p.major_id = $1
  AND p.post_type_id = $2
  AND p.is_deleted = false
  AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
  ORDER BY p.created_at desc
  `,
    [majorId, postTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getMyPostListByPostTypeIds = async (client, userId, postTypeIds) => {
  const { rows } = await client.query(
    `
    SELECT c.*, m.major_name 
    FROM "post" c
    INNER JOIN major m
    ON c.major_id = m.id
    AND m.is_deleted = false
    AND c.writer_id = $1
    AND c.post_type_id IN (${postTypeIds.join()})
    AND c.is_deleted = false
    ORDER BY c.created_at desc
  `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deletePostListByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE post
    SET is_deleted = true, updated_at = now()
    WHERE writer_id = $1
    AND is_deleted = false
    RETURNING id, is_deleted, updated_at
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getPostListByLike = async (client, userId, postTypeIds, invisibleUserIds) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.post_type_id, p.writer_id, p.title, p.content, p.created_at
    FROM post p
    INNER JOIN "like" l
    ON p.id = l.post_id
    AND p.post_type_id = l.post_type_id
    AND l.user_id = $1
    AND l.is_liked = true
    AND l.post_type_id IN (${postTypeIds.join()})
    AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    AND p.is_deleted = false
    ORDER BY l.updated_at desc
  `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  createPost,
  deletePostByPostId,
  getPostListByUserId,
  getPostListByMajorId,
  getPostByPostId,
  updatePost,
  getMyPostListByPostTypeIds,
  deletePostListByUserSecession,
  getPostListByLike,
  getPostListByNotification,
};
