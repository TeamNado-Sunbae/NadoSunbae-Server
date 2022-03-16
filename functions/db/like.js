const _ = require("lodash");
const postType = require("../constants/postType");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getLikeCountByPostId = async (client, postId, postTypeId) => {
  const { rows } = await client.query(
    `
        SELECT cast(count(*) as integer) AS like_count FROM "like"
        WHERE post_id = $1 
        AND post_type_id = $2
        AND is_liked = true
        `,
    [postId, postTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getLikeCountByUserId = async (client, userId, invisibleUserIds) => {
  const reviewPostPostTypeId = postType.REVIEW;
  const classroomPostPostTypeIds = [
    postType.INFORMATION,
    postType.QUESTION_TO_EVERYONE,
    postType.QUESTION_TO_PERSON,
  ];

  const { rows } = await client.query(
    `
        WITH LIKE_ID AS (
          SELECT l.id FROM "like" l
          INNER JOIN review_post p
          ON l.post_id = p.id
          AND l.user_id = $1
          AND l.post_type_id = $2
          AND l.is_liked = true
          AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
          AND p.is_deleted = false
          UNION
          SELECT l.id FROM "like" l
          INNER JOIN classroom_post p
          ON l.post_id = p.id
          AND l.post_type_id = p.post_type_id
          AND l.user_id = $1
          AND l.is_liked = true
          AND l.post_type_id IN (${classroomPostPostTypeIds.join()})
          AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
          AND p.is_deleted = false
        )

        SELECT cast(count(*) as integer) AS like_count FROM LIKE_ID
        `,
    [userId, reviewPostPostTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getLikeByPostId = async (client, postId, postTypeId, userId) => {
  const { rows } = await client.query(
    `
        SELECT * FROM "like"
        WHERE post_id = $1 
        AND post_type_id = $2 
        AND user_id = $3
        `,
    [postId, postTypeId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getLikeListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
        SELECT post_id, post_type_id, is_liked FROM "like"
        WHERE user_id = $1
        `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const createLikeByPostId = async (client, postId, postTypeId, userId) => {
  const { rows } = await client.query(
    `
    INSERT INTO "like"
    (post_id, post_type_id, user_id, is_liked)
    VALUES
    ($1, $2, $3, true)
    RETURNING post_id, is_liked
    `,
    [postId, postTypeId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateLikeByPostId = async (client, postId, postTypeId, userId) => {
  const { rows } = await client.query(
    `
    UPDATE "like"
    SET updated_at = now(), is_liked = CASE
    WHEN is_liked = true THEN false
    ELSE true
    END
    WHERE post_id = $1
    AND post_type_id = $2
    AND user_id = $3
    RETURNING post_id, is_liked
    `,
    [postId, postTypeId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteLikeListByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE "like"
    SET is_liked = false, updated_at = now()
    WHERE user_id = $1
    AND is_liked = true
    RETURNING id, is_liked, updated_at
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getLikeCountByPostId,
  getLikeByPostId,
  createLikeByPostId,
  updateLikeByPostId,
  getLikeCountByUserId,
  deleteLikeListByUserSecession,
  getLikeListByUserId,
};
