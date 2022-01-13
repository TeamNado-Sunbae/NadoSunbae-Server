const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getPostTypeIdByPostTypeName = async (client, postTypeName) => {
  const { rows } = await client.query(
    `
      SELECT id FROM post_type
      WHERE post_type_name = $1
      AND is_deleted = FALSE
      `,
    [postTypeName],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { getPostTypeIdByPostTypeName };
