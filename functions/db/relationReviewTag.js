const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createRelationReviewTag = async (client, reviewId, tagId) => {
  const { rows } = await client.query(
    `
    INSERT INTO relation_review_tag
    (review_id, tag_id)
    VALUES
    ($1, $2)
    RETURNING *
    `,
    [reviewId, tagId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getTagListByReviewId = async (client, reviewId) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT tag_id from "relation_review_tag"
    WHERE review_id = $1
    AND is_deleted = false
     `,
    [reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getRelationReviewTagList = async (client) => {
  const { rows } = await client.query(
    `
    SELECT r.review_id, t.tag_name
    FROM relation_review_tag r
    INNER JOIN tag t
    ON t.id = r.tag_id
    AND t.is_deleted = false
    AND r.is_deleted = false
    ORDER BY t.id
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getTagNameListByReviewId = async (client, reviewId) => {
  const { rows } = await client.query(
    `
    SELECT t.tag_name
    FROM "relation_review_tag" r LEFT JOIN tag t 
    on t.id = r.tag_id
    WHERE r.review_id = $1
    AND r.is_deleted = false
    AND t.is_deleted = false
    ORDER BY t.id
    `,
    [reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteRelationReviewTagByTagList = async (client, reviewId, tagList) => {
  const { rows } = await client.query(
    `
    UPDATE "relation_review_tag"
    SET is_deleted = true, updated_at = now()
    WHERE review_id = $1
    AND tag_id IN (${tagList.join()})
    AND is_deleted = false
        RETURNING *
    `,
    [reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteRelationReviewTag = async (client, reviewId) => {
  const { rows } = await client.query(
    `
    UPDATE relation_review_tag
    SET is_deleted = true, updated_at = now()
    WHERE review_id = $1
    RETURNING *
    `,
    [reviewId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  createRelationReviewTag,
  getTagListByReviewId,
  deleteRelationReviewTag,
  deleteRelationReviewTagByTagList,
  getTagNameListByReviewId,
  getRelationReviewTagList,
};
