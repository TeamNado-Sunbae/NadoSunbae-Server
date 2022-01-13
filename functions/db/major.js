const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getDataByMajorId = async (client, majorId) => {
  const { rows } = await client.query(
    `
    SELECT major_name, homepage, subject_table FROM "major" m
    WHERE m.id = $1
    `,
    [majorId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getDataByMajorId };
