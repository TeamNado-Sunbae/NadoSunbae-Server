const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const deleteClassroomPostByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
      UPDATE classroom_post p
      SET is_deleted = true, updated_at = now()
      WHERE id = $1
      RETURNING id as post_id, is_deleted
      `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getClassroomPostListByUserId = async (client, userId, invisibleUserIds) => {
  const { rows } = await client.query(
    `
      SELECT * FROM classroom_post
      WHERE answerer_id = $1
      AND writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
      AND is_deleted = false
          `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getClassroomPostByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM classroom_post 
    WHERE id = $1
      AND is_deleted = false
    `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getClassroomPostListByNotification = async (client) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.is_deleted
    FROM classroom_post p
    INNER JOIN "user" u
    ON p.writer_id = u.id
    AND u.is_deleted = false
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const createClassroomPost = async (
  client,
  majorId,
  writerId,
  answererId,
  postTypeId,
  title,
  content,
) => {
  const { rows } = await client.query(
    `
    INSERT INTO classroom_post
    (major_id, writer_id ,answerer_id, post_type_id, title, content)
    VALUES
    ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [majorId, writerId, answererId, postTypeId, title, content],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateClassroomPost = async (client, title, content, postId) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM classroom_post p
    WHERE id = $1
       AND is_deleted = false
    `,
    [postId],
  );

  if (existingRows.length === 0) return false;

  const data = _.merge({}, convertSnakeToCamel.keysToCamel(existingRows[0]), { title, content });

  const { rows } = await client.query(
    `
    UPDATE classroom_post p
    SET title = $1, content = $2, updated_at = now()
    WHERE id = $3
    RETURNING * 
    `,
    [data.title, data.content, postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getClassroomPostListByMajorId = async (client, majorId, postTypeId, invisibleUserIds) => {
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
  FROM "classroom_post" p
  INNER JOIN "user" u
  ON p.writer_id = u.id
  AND u.is_deleted = false
  AND p.major_id = $1
  AND p.post_type_id = $2
  AND p.is_deleted = false
  AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
  `,
    [majorId, postTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getMyClassroomPostListByPostTypeIds = async (client, userId, postTypeIds) => {
  const { rows } = await client.query(
    `
    SELECT c.*, m.major_name 
    FROM "classroom_post" c
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

const deleteClassroomPostByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE classroom_post
    SET is_deleted = true, updated_at = now()
    WHERE writer_id = $1
    AND is_deleted = false
    RETURNING id, is_deleted, updated_at
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getClassroomPostListByLike = async (client, userId, postTypeIds, invisibleUserIds) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.writer_id, p.title, p.content, p.created_at
    FROM classroom_post p
    INNER JOIN "like" l
    ON p.id = l.post_id
    AND p.post_type_id = l.post_type_id
    AND l.user_id = $1
    AND l.is_liked = true
    AND l.post_type_id IN (${postTypeIds.join()})
    AND p.writer_id != $1
    AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    AND (p.answerer_id != $1 OR p.answerer_id IS NULL)
    AND p.is_deleted = false
    ORDER BY l.updated_at desc
  `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  createClassroomPost,
  deleteClassroomPostByPostId,
  getClassroomPostListByUserId,
  getClassroomPostListByMajorId,
  getClassroomPostByPostId,
  updateClassroomPost,
  getMyClassroomPostListByPostTypeIds,
  deleteClassroomPostByUserSecession,
  getClassroomPostListByLike,
  getClassroomPostListByNotification,
};
