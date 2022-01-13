const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getMajorsByUniversityId = async (client, universityId, isFirstMajor, isSecondMajor) => {
  const { rows } = await client.query(
    `
    SELECT id as major_id, major_name, is_first_major, is_second_major FROM "major" m
    WHERE m.university_id = $1
    AND m.is_first_major = $2
    AND m.is_second_major = $3
    AND is_deleted = false
        `,
    [universityId, isFirstMajor, isSecondMajor],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getMajorByMajorId = async (client, majorId) => {
  const { rows } = await client.query(
    `
    SELECT major_name, homepage, subject_table FROM "major" m
    WHERE m.id = $1
    AND is_deleted = false
    `,
    [majorId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

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

module.exports = { getMajorByMajorId, getMajorNameByMajorId, getMajorsByUniversityId, };
