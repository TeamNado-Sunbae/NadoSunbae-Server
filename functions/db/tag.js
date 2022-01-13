const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getTagByTagName = async (client, tagName) => {
  const { rows } = await client.query(
    `
      SELECT * FROM tag
      WHERE tag_name = $1
      AND is_deleted = FALSE
      `,
    [tagName],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { getTagByTagName };
