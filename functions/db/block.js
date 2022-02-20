const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createBlock = async (client, blockUserId, blockedUserId) => {
  const { rows } = await client.query(
    `
    INSERT INTO block
    (block_user_id, blocked_user_id)
    VALUES
    ($1, $2)
    RETURNING *
        `,
    [blockUserId, blockedUserId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getBlockByUserId = async (client, blockUserId, blockedUserId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM block
      WHERE block_user_id = $1
      AND blocked_user_id = $2
          `,
    [blockUserId, blockedUserId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getBlockedUserListByBlockUserId = async (client, blockUserId) => {
  const { rows } = await client.query(
    `
    SELECT u.id, u.profile_image_id ,u.nickname FROM block AS b
    INNER JOIN "user" AS u
    ON b.block_user_id = $1
    AND b.is_deleted = false
    AND b.blocked_user_id = u.id
    AND u.is_deleted = false;
          `,
    [blockUserId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updateBlockByUserId = async (client, blockUserId, blockedUserId) => {
  const { rows } = await client.query(
    `
      UPDATE block
      SET updated_at = now(), is_deleted = CASE
      WHEN is_deleted = true THEN false
      ELSE true
      END
      WHERE block_user_id = $1
      AND blocked_user_id = $2
      RETURNING *
      `,
    [blockUserId, blockedUserId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteBlockByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE block
    SET is_deleted = TRUE, updated_at = now()
    WHERE block_user_id = $1 OR blocked_user_id = $1
    AND is_deleted = FALSE
    RETURNING id, is_deleted, updated_at
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  createBlock,
  getBlockedUserListByBlockUserId,
  getBlockByUserId,
  updateBlockByUserId,
  deleteBlockByUserSecession,
};
