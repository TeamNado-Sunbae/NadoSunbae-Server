const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getReviewPostListByFilters = async (
  client,
  majorId,
  writerFilter,
  tagFilter,
  invisibleUserIds,
) => {
  const { rows } = await client.query(
    `
    SELECT p.*
    FROM review_post p
    LEFT JOIN relation_review_post_tag r on p.id = r.post_id
    WHERE major_id = $1
    AND p.is_first_major IN (${writerFilter.join()})
    AND r.tag_id IN (${tagFilter.join()})
    AND p.is_deleted = false
    AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    AND r.is_deleted = false
    GROUP BY p.id
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

const deleteReviewPost = async (client, postId) => {
  const { rows } = await client.query(
    `
    UPDATE review_post
    SET is_deleted = true, updated_at = now()
    WHERE id = $1
    RETURNING id as post_id, is_deleted
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
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewPostCountByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
      SELECT cast(count(*) as integer) 
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
      AND is_deleted = false
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

const deleteReviewPostByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE review_post
    SET is_deleted = true, updated_at = now()
    WHERE writer_id = $1
    AND is_deleted = false
    RETURNING id, is_deleted, updated_at
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewPostListByLike = async (client, userId, postTypeId, invisibleUserIds) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.writer_id, p.one_line_review, p.created_at
    FROM review_post p
    INNER JOIN "like" l
    ON p.id = l.post_id
    AND l.user_id = $1
    AND l.is_liked = true
    AND l.post_type_id = $2
    AND p.writer_id != $1
    AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    AND p.is_deleted = false
    ORDER BY l.updated_at desc
  `,
    [userId, postTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getReviewPostListByFilters,
  getReviewPostByPostId,
  createReviewPost,
  deleteReviewPost,
  updateReviewPost,
  getReviewPostByUserId,
  getReviewPostCountByUserId,
  deleteReviewPostByUserSecession,
  getReviewPostListByLike,
};
