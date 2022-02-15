const _ = require("lodash");
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

const getBlockListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM block
      WHERE block_user_id = $1
      AND is_deleted = false
          `,
    [userId],
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

module.exports = {
  createBlock,
  getBlockListByUserId,
  getBlockByUserId,
  updateBlockByUserId,
};
