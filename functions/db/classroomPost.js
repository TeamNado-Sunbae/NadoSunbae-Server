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

const createPost = async (client, majorId, writerId, answererId, postTypeId, title, content) => {
  const { rows } = await client.query(
    `
    INSERT INTO classroom_post
    (major_id, writer_id ,answerer_id, post_type_id, title, content)
    VALUES
    ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [majorId, writerId, answererId, postTypeId, title, content],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getClassroomPostByPostId,
  createPost,
};
