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

module.exports = {
  getTagList,
};
