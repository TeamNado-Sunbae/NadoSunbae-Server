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

module.exports = { createRelationReviewPostTag };
