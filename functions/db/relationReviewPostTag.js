const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createRelationReviewPostTag = async (client, postId, tagId) => {
  const { rows } = await client.query(
    `
    INSERT INTO relation_review_post_tag
    (post_id, tag_id)
    VALUES
    ($1, $2)
    RETURNING *
    `,
    [postId, tagId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteRelationReviewPostTag = async (client, postId) => {
  const { rows } = await client.query(
    `
    UPDATE "relation_review_post_tag"
    SET is_deleted = true, updated_at = now()
    WHERE post_id = $1
    AND is_deleted = false
    RETURNING *
    `,
    [postId],
  );
};

module.exports = { createRelationReviewPostTag, deleteRelationReviewPostTag };
