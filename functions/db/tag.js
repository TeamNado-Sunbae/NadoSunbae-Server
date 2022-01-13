const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getTagList = async (client) => {
  const { rows } = await client.query(
    `
      SELECT id as tag_id, tag_name FROM tag
      WHERE is_deleted = FALSE
      `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

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

module.exports = { getTagList, getTagByTagName };
