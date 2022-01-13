const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const updateComment = async (client, commentId, content) => {
  const { rows: existingRows } = await client.query(
    `
      SELECT * FROM comment
      WHERE id = $1
      AND is_deleted = FALSE
      `,
    [commentId],
  );

  if (existingRows.length === 0) return false;

  const data = _.merge({}, convertSnakeToCamel.keysToCamel(existingRows[0]), {
    content,
  });

  const { rows } = await client.query(
    `
      UPDATE comment
      SET content = $1, updated_at = now()
      WHERE id = $2
      RETURNING * 
      `,
    [data.content, commentId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getCommentByCommentId = async (client, commentId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM comment
      WHERE id = $1
      AND is_deleted = FALSE
      `,
    [commentId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { updateComment, getCommentByCommentId };
