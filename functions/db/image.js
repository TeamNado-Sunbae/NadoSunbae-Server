const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getBannerImageList = async (client, type) => {
  const { rows } = await client.query(
    `
    SELECT image_url FROM image
    WHERE type = $1
    ORDER BY image_url
      `,
    [type],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getBannerImageList,
};
