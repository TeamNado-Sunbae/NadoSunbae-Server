const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getClassroomPostListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM classroom_post
      WHERE answerer_id = $1
      AND is_deleted = false
          `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getClassroomPostListByUserId };
