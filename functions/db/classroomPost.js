const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const deleteClassroomPostByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
      UPDATE classroom_post p
      SET is_deleted = TRUE, updated_at = now()
      WHERE id = $1
      RETURNING id as post_id, is_deleted
      `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getClassroomPostListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM classroom_post
      WHERE answerer_id = $1
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
      AND is_deleted = FALSE
    `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
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
       AND is_deleted = FALSE
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

const getClassroomPostListByMajorId = async (client, majorId, postTypeId) => {
  const { rows } = await client.query(
    `
  SELECT * FROM "classroom_post" c
  WHERE major_id = $1
  AND post_type_id = $2
  AND is_deleted = false
  `,
    [majorId, postTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getMyClassroomPostListByPostTypeIds = async (client, userId, postTypeIds) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "classroom_post" c
    WHERE writer_id = $1
    AND post_type_id IN (${postTypeIds.join()})
    AND is_deleted = false
    ORDER BY created_at desc
  `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteClassroomPostByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE classroom_post
    SET is_deleted = TRUE, updated_at = now()
    WHERE writer_id = $1
    AND is_deleted = FALSE
    RETURNING id, is_deleted, updated_at
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
};
