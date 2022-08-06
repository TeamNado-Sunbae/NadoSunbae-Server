const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getBannerImages = async (client) => {
  const { rows } = await client.query(
    `
    select image_url from image
      `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getBannerImages,
};
