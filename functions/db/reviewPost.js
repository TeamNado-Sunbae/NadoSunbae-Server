const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getRiviewPostListByFilters = async (client, majorId, writerFilter, tagFilter) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT ON (review_post.id) *
    FROM review_post
    left join relation_review_post_tag rrpt on review_post.id = rrpt.post_id
    WHERE major_id = $1
    AND is_first_major IN (${writerFilter.join()})
    AND rrpt.tag_id IN (${tagFilter.join()})
    AND review_post.is_deleted = false
    AND rrpt.is_deleted = false
      `,
    [majorId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
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

const updateReviewPostByReport = async (client, postId) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM review_post p
    WHERE id = $1
       AND is_deleted = FALSE
    `,
    [postId],
  );

  if (existingRows.length === 0) return false;

  const { rows } = await client.query(
    `
    UPDATE review_post p
    SET report_count = report_count + 1, updated_at = now()
    WHERE id = $1
    AND is_deleted = FALSE
    RETURNING id as post_id, report_count
    `,
    [postId],
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
  getRiviewPostListByFilters,
  getReviewPostByPostId,
  createReviewPost,
  deleteReviewPost,
  updateReviewPost,
  updateReviewPostByReport,
  getReviewPostByUserId,
};
