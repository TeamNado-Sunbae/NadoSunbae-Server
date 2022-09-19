const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getBannerList = async (client, type) => {
  const { rows } = await client.query(
    `
    SELECT image_url, redirect_url FROM banner
    WHERE type = $1
    ORDER BY image_url
      `,
    [type],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getBannerList,
};
