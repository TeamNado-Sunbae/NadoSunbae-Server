const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getImageUrlByImageId = async (client, imageId) => {
  const { rows } = await client.query(
    `
        SELECT image_url
        FROM image
        WHERE id = $1
          AND is_deleted = false
        `,
    [imageId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getImageUrlByImageId,
};
