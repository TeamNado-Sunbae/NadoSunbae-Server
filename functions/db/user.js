const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getUserByNickname = async (client, nickname) => {
  const { rows } = await client.query(
    `
      SELECT id, nickname FROM "user"
      WHERE nickname = $1
      `,
    [nickname],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { getUserByNickname };
