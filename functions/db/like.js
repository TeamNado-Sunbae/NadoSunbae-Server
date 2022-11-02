const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getLikeCountByTarget = async (client, targetId, targetTypeId) => {
  const { rows } = await client.query(
    `
        SELECT cast(count(*) as integer) AS like_count FROM "like"
        WHERE target_id = $1 
        AND target_type_id = $2
        AND is_liked = true
        `,
    [targetId, targetTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getLikeCountByUserId = async (
  client,
  reviewLikeType,
  postLikeType,
  userId,
  invisibleUserIds,
) => {
  const { rows } = await client.query(
    `
        SELECT cast(count(*) as integer) AS like_count FROM 
        (
          SELECT l.id FROM "like" l
          INNER JOIN review r
          ON l.target_id = r.id
          AND l.target_type_id = $2
          AND l.user_id = $1
          AND l.is_liked = true
          AND r.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
          AND r.is_deleted = false
          UNION
          SELECT l.id FROM "like" l
          INNER JOIN post p
          ON l.target_id = p.id
          AND l.target_type_id = $3
          AND l.user_id = $1
          AND l.is_liked = true
          AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
          AND p.is_deleted = false
        ) as like_id
        `,
    [userId, reviewLikeType, postLikeType],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getLikeByTarget = async (client, targetId, targetTypeId, userId) => {
  const { rows } = await client.query(
    `
        SELECT * FROM "like"
        WHERE target_id = $1 
        AND target_type_id = $2 
        AND user_id = $3
        `,
    [targetId, targetTypeId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getLikeListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
        SELECT target_id, target_type_id, is_liked FROM "like"
        WHERE user_id = $1
        `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const createLikeByTarget = async (client, targetId, targetTypeId, userId) => {
  const { rows } = await client.query(
    `
    INSERT INTO "like"
    (target_id, target_type_id, user_id, is_liked)
    VALUES
    ($1, $2, $3, true)
    RETURNING target_id, is_liked
    `,
    [targetId, targetTypeId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateLikeByTarget = async (client, targetId, targetTypeId, userId) => {
  const { rows } = await client.query(
    `
    UPDATE "like"
    SET updated_at = now(), is_liked = CASE
    WHEN is_liked = true THEN false
    ELSE true
    END
    WHERE target_id = $1
    AND target_type_id = $2
    AND user_id = $3
    RETURNING target_id, is_liked
    `,
    [targetId, targetTypeId, userId],
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
  getLikeCountByTarget,
  getLikeByTarget,
  createLikeByTarget,
  updateLikeByTarget,
  getLikeCountByUserId,
  deleteLikeListByUserSecession,
  getLikeListByUserId,
};
