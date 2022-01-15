const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getAllMajorsByUniversityId = async (client, universityId) => {
  const { rows } = await client.query(
    `
    SELECT id as major_id, major_name, is_first_major, is_second_major FROM "major" m
    WHERE m.university_id = $1
    AND is_deleted = false
    ORDER BY major_id
    `,
    [universityId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getFirstMajorsByUniversityId = async (client, universityId) => {
  const { rows } = await client.query(
    `
    SELECT id as major_id, major_name, is_first_major, is_second_major FROM "major" m
    WHERE m.university_id = $1
    AND m.is_first_major = true
    AND is_deleted = false
    ORDER BY major_id
    `,
    [universityId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getSecondMajorsByUniversityId = async (client, universityId) => {
  const { rows } = await client.query(
    `
    SELECT id as major_id, major_name, is_first_major, is_second_major FROM "major" m
    WHERE m.university_id = $1
    AND m.is_second_major = true
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
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getMajorByMajorId,
  getMajorNameByMajorId,
  getAllMajorsByUniversityId,
  getFirstMajorsByUniversityId,
  getSecondMajorsByUniversityId,
};
