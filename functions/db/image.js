const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getReviewPostBackgroundImages = async (client) => {
  const { rows } = await client.query(
    `
    SELECT id as image_id, image_url FROM "image" i
    WHERE id
    BETWEEN 6 AND 12
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getImageUrlByImageId = async (client, imageId) => {
  const { rows } = await client.query(
    `
        SELECT image_url FROM image
        WHERE id = $1
        AND is_deleted = false
        `,
    [imageId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getImageUrlByImageId,
  getReviewPostBackgroundImages,
};
