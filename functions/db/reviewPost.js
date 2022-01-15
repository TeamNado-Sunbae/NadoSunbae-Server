const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getRiviewPostListByMajorId = async (client, majorId, tagFilter) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT ON (review_post.id) *
    FROM review_post
    left join relation_review_post_tag rrpt on review_post.id = rrpt.post_id
    WHERE major_id = $1
    AND rrpt.tag_id IN (${tagFilter.join()})
    AND review_post.is_deleted = false
      `,
    [majorId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getRiviewPostListByWriterFilter = async (client, majorId, isFirstMajor, tagFilter) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT ON (review_post.id) *
    FROM review_post
    left join relation_review_post_tag rrpt on review_post.id = rrpt.post_id
    WHERE major_id = $1
    AND is_first_major = $2
    AND rrpt.tag_id IN (${tagFilter.join()})
    AND review_post.is_deleted = false
      `,
    [majorId, isFirstMajor],
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

module.exports = {
  getRiviewPostListByMajorId,
  getRiviewPostListByWriterFilter,
  getReviewPostByPostId,
  createReviewPost,
};
