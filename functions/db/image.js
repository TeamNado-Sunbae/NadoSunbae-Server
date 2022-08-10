const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getBannerImageList = async (client) => {
  const { rows } = await client.query(
    `
    SELECT image_url FROM image
      `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getBannerImageList,
};
