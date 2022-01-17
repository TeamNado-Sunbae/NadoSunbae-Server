const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createClassroomPost = async (
  client,
  majorId,
  writerId,
  answererId,
  postTypeId,
  title,
  content,
) => {
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
  createClassroomPost,
};
