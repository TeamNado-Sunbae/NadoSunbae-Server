const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createInappropriateReview = async (client, reviewId, writerId, reason) => {
  const { rows } = await client.query(
    `
      INSERT INTO inappropriate_review
      (review_id, writer_id, reason)
      VALUES
      ($1, $2, $3)
      RETURNING *
      `,
    [reviewId, writerId, reason],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteInappropriateReviewList = async (client, writerId) => {
  const { rows } = await client.query(
    `
      UPDATE inappropriate_review
      SET is_deleted = true, updated_at = now()
      WHERE writer_id = $1
      AND is_deleted = false
      RETURNING *
      `,
    [writerId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getInappropriateReviewByUser = async (client, writerId) => {
  const { rows } = await client.query(
    `
    SELECT id FROM inappropriate_review
    WHERE writer_id = $1
    AND is_deleted = false
    `,
    [writerId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  createInappropriateReview,
  deleteInappropriateReviewList,
  getInappropriateReviewByUser,
};
