const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const deleteCommentByPostId = async (client, postId) => {
  const { rows: existingRows } = await client.query(
    `
      SELECT * FROM comment 
      WHERE post_id = $1
         AND is_deleted = FALSE
      `,
    [postId],
  );

  if (existingRows.length === 0) return true;

  const { rows } = await client.query(
    `
      UPDATE comment 
      SET is_deleted = TRUE, updated_at = now()
      WHERE post_id = $1
      RETURNING *
      `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  deleteCommentByPostId,
};
