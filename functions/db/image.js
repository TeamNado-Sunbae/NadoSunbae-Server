const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getBannerImageList = async (client) => {
  const { rows } = await client.query(
    `
    select image_url from image
      `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getBannerImageList,
};
