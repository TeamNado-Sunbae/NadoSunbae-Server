const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getEmailByUniversityId = async (client, universityId) => {
  const { rows } = await client.query(
    `
    SELECT email FROM university
    WHERE id = $1
    AND is_deleted = false
    `,
    [universityId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getNameByUniversityId = async (client, universityId) => {
  const { rows } = await client.query(
    `
    SELECT university_name FROM university
    WHERE id = $1
    AND is_deleted = false
    `,
    [universityId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getNameByMajorId = async (client, majorId) => {
  const { rows } = await client.query(
    `
    SELECT university_name 
    FROM university u
    INNER JOIN major m
    ON m.university_id = u.id
    AND m.id = $1
    AND is_deleted = false
    `,
    [majorId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getEmailByUniversityId,
  getNameByUniversityId,
  getNameByMajorId,
};
