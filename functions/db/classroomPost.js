const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const deleteClassroomPostByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
      UPDATE classroom_post p
      SET is_deleted = TRUE, updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
    [postId],
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getClassroomPostByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM classroom_post 
    WHERE id = $1
      AND is_deleted = FALSE
    `,
    [postId],
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  deleteClassroomPostByPostId,
  getClassroomPostByPostId,
};
