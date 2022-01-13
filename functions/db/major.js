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

const getMajorByMajorId = async (client, majorId) => {
  const { rows } = await client.query(
    `
    SELECT major_name, homepage, subject_table FROM "major" m
    WHERE m.id = $1,
    AND is_deleted = false
    `,
    [majorId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getMajorByMajorId, getMajorNameByMajorId };
