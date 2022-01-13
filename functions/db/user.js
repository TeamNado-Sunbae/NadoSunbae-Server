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

const createUser = async (
  client,
  email,
  nickname,
  universityId,
  firstMajorId,
  firstMajorStart,
  secondMajorId,
  secondMajorStart,
  firebaseId,
) => {
  const { rows } = await client.query(
    `
      INSERT INTO "user"
      (email, nickname, university_id, first_major_id, first_major_start, second_major_id, second_major_start, firebase_id)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,

    [
      email,
      nickname,
      universityId,
      firstMajorId,
      firstMajorStart,
      secondMajorId,
      secondMajorStart,
      firebaseId,
    ],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getUserByFirebaseId = async (client, firebaseId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "user" u
    WHERE firebase_id = $1
      AND is_deleted = FALSE
    `,
    [firebaseId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  createUser,
  getUserByNickname,
  getUserByFirebaseId,
};
