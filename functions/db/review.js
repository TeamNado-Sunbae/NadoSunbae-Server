const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getReviewListByFilters = async (
  client,
  majorId,
  writerFilter,
  tagFilter,
  invisibleUserIds,
  likeTypeId,
) => {
  const { rows } = await client.query(
    `
    WITH USER_MAJOR AS (
      SELECT u.id, u.first_major_start, u.second_major_start, u.profile_image_id, u.nickname, u.is_deleted, m1.major_name first_major_name, m2.major_name second_major_name
      FROM "user" u
      INNER JOIN major m1
      ON u.first_major_id = m1.id
      AND u.is_deleted = false
      AND m1.is_deleted = false
      INNER JOIN major m2
      ON u.second_major_id = m2.id
      AND u.is_deleted = false
      AND m2.is_deleted = false
    )

    SELECT DISTINCT ON (r.id) r.*, u.first_major_start, u.second_major_start, u.profile_image_id, u.nickname, u.first_major_name, u.second_major_name,
    (
      SELECT cast(count(l.*) as integer) AS like_count FROM "like" l
      WHERE l.target_id = r.id
      AND l.target_type_id = $2
      AND l.is_liked = true
      AND r.is_deleted = false
    )
      FROM review r
      INNER JOIN USER_MAJOR u
      ON u.id = r.writer_id
      AND u.is_deleted = false
      AND r.is_deleted = false
      AND r.major_id = $1
      AND r.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
      AND r.is_first_major IN (${writerFilter.join()})
      AND r.id = ANY (
        SELECT rel.review_id
        FROM relation_review_tag rel
        INNER JOIN "tag" t
        ON t.id = rel.tag_id
        AND t.id IN (${tagFilter.join()})
        AND rel.is_deleted = false
        AND t.is_deleted = false
       )
      `,
    [majorId, likeTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewById = async (client, id) => {
  const { rows } = await client.query(
    `
      SELECT * 
      FROM review
      WHERE id = $1
        AND is_deleted = false
      `,
    [id],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const createReview = async (
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
    INSERT INTO review
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

const deleteReview = async (client, id) => {
  const { rows } = await client.query(
    `
    UPDATE review
    SET is_deleted = true, updated_at = now()
    WHERE id = $1
    RETURNING id, is_deleted, writer_id
    `,
    [id],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getReviewListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
      SELECT r.*, m.major_name
      FROM review r
      INNER JOIN major m
      ON r.major_id = m.id
      AND m.is_deleted = false
      AND r.writer_id = $1
      AND r.is_deleted = false
      ORDER BY created_at desc
      `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewCountByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
      SELECT cast(count(*) as integer) 
      FROM review
      WHERE writer_id = $1
        AND is_deleted = false
      `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateReview = async (
  client,
  id,
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
      SELECT * FROM review
      WHERE id = $1
      AND is_deleted = false
      `,
    [id],
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
    UPDATE "review"
    SET background_image_id = $2, one_line_review = $3,
    pros_cons = $4, curriculum = $5, recommend_lecture = $6,
    non_recommend_lecture = $7, career = $8,
    tip = $9, updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING *
      `,
    [
      id,
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

const deleteReviewListByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE review
    SET is_deleted = true, updated_at = now()
    WHERE writer_id = $1
    AND is_deleted = false
    RETURNING id, is_deleted, updated_at
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReviewListByLike = async (client, userId, likeTypeId, invisibleUserIds) => {
  const { rows } = await client.query(
    `
    SELECT r.id, r.writer_id, r.one_line_review, r.created_at
    FROM review r
    INNER JOIN "like" l
    ON r.id = l.target_id
    AND l.target_type_id = $2
    AND l.user_id = $1
    AND l.is_liked = true
    AND r.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    AND r.is_deleted = false
    ORDER BY l.updated_at desc
  `,
    [userId, likeTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getReviewListByFilters,
  getReviewById,
  createReview,
  deleteReview,
  updateReview,
  getReviewListByUserId,
  getReviewCountByUserId,
  deleteReviewListByUserSecession,
  getReviewListByLike,
};