const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getBannerImageList = async (client) => {
  const { rows } = await client.query(
    `
    SELECT image_url, type FROM image
    ORDER BY image_url
      `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getBannerImageList,
};
