const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getReviewPostBackgroundImages = async (client) => {
  const { rows } = await client.query(
    `
    SELECT id as image_id, image_url FROM "image" i
    WHERE id
    BETWEEN 6 AND 10
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getReviewPostBackgroundImages,
};
