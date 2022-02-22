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

const getLikeCountByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
        SELECT cast(count(*) as integer) AS like_count FROM "like"
        WHERE user_id = $1
        AND is_liked = true
        `,
    [userId],
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

const deleteLikeByUserSecession = async (client, userId) => {
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
  deleteLikeByUserSecession,
};
