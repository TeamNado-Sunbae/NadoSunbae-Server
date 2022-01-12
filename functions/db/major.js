const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getMajorNameByMajorId = async (client, majorId) => {
  const { rows } = await client.query(
    `
        SELECT major_name FROM major
        WHERE id = $1
        AND is_deleted = false
        `,
    [majorId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getMajorNameByMajorId,
};
