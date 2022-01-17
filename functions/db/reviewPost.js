const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

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

const createReviewPost = async (
  client,
  majorId,
  writerId,
  backgroundImageId,
  isFirstMajor,
  oneLineReview,
  prosCons,
  curriculum,
  recommendLecture,
  nonRecommendLecture,
  career,
  tip,
) => {
  const { rows } = await client.query(
    `
    INSERT INTO review_post
    (major_id, writer_id, background_image_id, is_first_major, one_line_review, pros_cons, curriculum, recommend_lecture, non_recommend_lecture, career, tip)
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
      recommendLecture,
      nonRecommendLecture,
      career,
      tip,
    ],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateReviewPost = async (
  client,
  postId,
  backgroundImageId,
  oneLineReview,
  prosCons,
  curriculum,
  recommendLecture,
  nonRecommendLecture,
  career,
  tip,
) => {
  const { rows: existingRows } = await client.query(
    `
      SELECT * FROM review_post
      WHERE id = $1
      AND is_deleted = FALSE
      `,
    [postId],
  );

  if (existingRows.length === 0) return false;

  const data = _.merge({}, convertSnakeToCamel.keysToCamel(existingRows[0]), {
    backgroundImageId,
    oneLineReview,
    prosCons,
    curriculum,
    recommendLecture,
    nonRecommendLecture,
    career,
    tip,
  });

  const { rows } = await client.query(
    `
    UPDATE "review_post"
    SET background_image_id = $2, one_line_review = $3,
    pros_cons = $4, curriculum = $5, recommend_lecture = $6,
    non_recommend_lecture = $7, career = $8,
    tip = $9, updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING *
      `,
    [
      postId,
      data.backgroundImageId,
      data.oneLineReview,
      data.prosCons,
      data.curriculum,
      data.recommendLecture,
      data.nonRecommendLecture,
      data.career,
      data.tip,
    ],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  createReviewPost,
  getReviewPostByPostId,
  updateReviewPost,
};
