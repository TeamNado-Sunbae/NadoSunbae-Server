const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getMajorListByUniversityId = async (client, universityId, isFirstMajor, isSecondMajor) => {
  const { rows } = await client.query(
    `
    SELECT id as major_id, major_name, is_first_major, is_second_major FROM "major" m
    WHERE m.university_id = $1
    AND m.is_first_major IN (${isFirstMajor.join()})
    AND m.is_second_major IN (${isSecondMajor.join()})
    AND m.major_name != '정보없음'
    AND is_deleted = false
    ORDER BY major_id
    `,
    [universityId],
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

const getMajorByMajorId = async (client, majorId) => {
  const { rows } = await client.query(
    `
    SELECT major_name, homepage, subject_table FROM "major" m
    WHERE m.id = $1
    AND is_deleted = false
    `,
    [majorId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getMajorByMajorId,
  getMajorNameByMajorId,
  getMajorListByUniversityId,
};
