const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createReviewPost = async (
  client,
  majorId,
  writerId,
  backgroundImageId,
  isFirstMajor,
  oneLineReview,
  prosCons,
  curriculum,
  career,
  recommendLecture,
  nonRecommendLecture,
  tip,
) => {
  const { rows } = await client.query(
    `
    INSERT INTO review_post
    (major_id, writer_id, background_image_id, is_first_major, one_line_review, pros_cons, curriculum, career, recommend_lecture, non_recommend_lecture, tip)
    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
    `,
    [
      majorId,
      writerId,
      backgroundImageId,
      isFirstMajor,
      oneLineReview,
      prosCons,
      curriculum,
      career,
      recommendLecture,
      nonRecommendLecture,
      tip,
    ],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteReviewPost = async (client, postId) => {
  const { rows } = await client.query(
    `
    UPDATE review_post
    SET is_deleted = TRUE, updated_at = now()
    WHERE id = $1
    RETURNING *
    `,
    [postId],
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getReviewPostByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
      SELECT * 
      FROM review_post
      WHERE id = $1
        AND is_deleted = false
      `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getReviewPostByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
      SELECT * 
      FROM review_post
      WHERE writer_id = $1
        AND is_deleted = false
      `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  createReviewPost,
  deleteReviewPost,
  getReviewPostByPostId,
  getReviewPostByUserId,
};
