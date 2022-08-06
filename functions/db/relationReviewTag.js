const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createRelationReviewTag = async (client, postId, tagId) => {
  const { rows } = await client.query(
    `
    INSERT INTO relation_review_tag
    (post_id, tag_id)
    VALUES
    ($1, $2)
    RETURNING *
    `,
    [postId, tagId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getTagListByReviewId = async (client, postId) => {
  const { rows } = await client.query(
    `
    SELECT DISTINCT tag_id from "relation_review_tag"
    WHERE post_id = $1
    AND is_deleted = false
     `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getRelationReviewTagList = async (client) => {
  const { rows } = await client.query(
    `
    SELECT r.post_id, t.tag_name
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

const getTagListById = async (client, postId) => {
  const { rows } = await client.query(
    `
    SELECT t.tag_name
    FROM "relation_review_tag" LEFT JOIN tag t 
    on t.id = relation_review_tag.tag_id
    WHERE post_id = $1
    AND relation_review_tag.is_deleted = false
    AND t.is_deleted = false
    ORDER BY t.id
    `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteRelationReviewTagByTagList = async (client, postId, tagList) => {
  const { rows } = await client.query(
    `
    UPDATE "relation_review_tag"
    SET is_deleted = true, updated_at = now()
    WHERE post_id = $1
    AND tag_id IN (${tagList.join()})
    AND is_deleted = false
        RETURNING *
    `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteRelationReviewTag = async (client, postId) => {
  const { rows } = await client.query(
    `
    UPDATE relation_review_tag
    SET is_deleted = true, updated_at = now()
    WHERE post_id = $1
    RETURNING *
    `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  createRelationReviewTag,
  getTagListByReviewId,
  deleteRelationReviewTag,
  deleteRelationReviewTagByTagList,
  getTagListById,
  getRelationReviewTagList,
};
