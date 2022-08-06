const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createInappropriateReview = async (client, postId, writerId, reason) => {
  const { rows } = await client.query(
    `
      INSERT INTO inappropriate_review
      (post_id, writer_id, reason)
      VALUES
      ($1, $2, $3)
      RETURNING *
      `,
    [postId, writerId, reason],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteInappropriateReviewList = async (client, userId) => {
  const { rows } = await client.query(
    `
      UPDATE inappropriate_review
      SET is_deleted = true, updated_at = now()
      WHERE writer_id = $1
      AND is_deleted = false
      RETURNING *
      `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getInappropriateReviewByUser = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT id FROM inappropriate_review
    WHERE writer_id = $1
    AND is_deleted = false
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  createInappropriateReview,
  deleteInappropriateReviewList,
  getInappropriateReviewByUser,
};
