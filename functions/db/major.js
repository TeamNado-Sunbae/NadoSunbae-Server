const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getMajorListByUniversityId = async (
  client,
  universityId,
  isFirstMajor,
  isSecondMajor,
  invisibleMajorNames,
) => {
  const { rows } = await client.query(
    `
    SELECT id as major_id, major_name FROM "major" m
    WHERE m.university_id = $1
    AND m.is_first_major IN (${isFirstMajor.join()})
    AND m.is_second_major IN (${isSecondMajor.join()})
    AND m.major_name <> all ($2)
    AND is_deleted = false
    `,
    [universityId, invisibleMajorNames],
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
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getMajorByExcludeMajorNames = async (client, majorNames, majorId) => {
  const { rows } = await client.query(
    `
    SELECT id FROM "major" m
    WHERE m.major_name <> all ($2)
    AND m.id = $1
    AND m.is_deleted = false
    `,
    [majorId, majorNames],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getMajorByMajorId,
  getMajorListByUniversityId,
  getMajorByExcludeMajorNames,
};
