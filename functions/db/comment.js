const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createComment = async (client, postId, writerId, content) => {
  const { rows } = await client.query(
    `
      INSERT INTO comment
      (post_id,writer_id ,content)
      VALUES
      ($1, $2, $3)
      RETURNING *
      `,
    [postId, writerId, content],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { createComment };
