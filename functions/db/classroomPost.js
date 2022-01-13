const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getClassroomPostByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM classroom_post
      WHERE id = $1
      AND is_deleted = false
      `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { getClassroomPostByPostId };
