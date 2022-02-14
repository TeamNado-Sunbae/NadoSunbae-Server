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

module.exports = {
  getEmailByUniversityId,
};
