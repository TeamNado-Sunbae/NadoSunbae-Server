const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getMajorsByUniversityId = async (client, universityId) => {
  const { rows } = await client.query(
    `
    SELECT id as major_id, major_name FROM "major" m
    WHERE m.university_id = $1
    AND is_deleted = false
        `,
    [universityId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getMajorsByUniversityId };
