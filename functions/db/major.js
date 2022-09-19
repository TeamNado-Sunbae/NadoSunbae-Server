const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getMajorListByUniversityId = async (
  client,
  universityId,
  isFirstMajor,
  isSecondMajor,
  invisibleMajorNames,
  userId,
) => {
  const { rows } = await client.query(
    `
    SELECT m.id as major_id, major_name,
    CASE WHEN f.is_deleted is NULL THEN false ELSE
    CASE WHEN f.is_deleted = true THEN false ELSE true END END is_favorites
    FROM "major" m
    LEFT JOIN favorites f
      ON f.major_id = m.id
      AND f.user_id = $3
    WHERE m.university_id = $1
    AND m.is_first_major IN (${isFirstMajor.join()})
    AND m.is_second_major IN (${isSecondMajor.join()})
    AND m.major_name <> all ($2)
    AND m.is_deleted = false
    `,
    [universityId, invisibleMajorNames, userId],
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
