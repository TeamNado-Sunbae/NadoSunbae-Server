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

const updateUserByIsReviewed = async (client, isReviewed, userId) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    AND is_deleted = FALSE
    `,
    [userId],
  );

  if (existingRows.length === 0) return false;

  const data = _.merge({}, convertSnakeToCamel.keysToCamel(existingRows[0]), { isReviewed });

  const { rows } = await client.query(
    `
    UPDATE "user"
    SET is_reviewed = $1, updated_at = now()
    WHERE id = $2
    RETURNING *
    `,
    [data.isReviewed, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getUserByFirstMajorId = async (client, majorId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM "user"
      WHERE first_major_id = $1
      AND is_deleted = FALSE
      `,
    [majorId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getUserByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM "user"
      WHERE id = $1
      AND is_deleted = FALSE
      `,
    [userId],
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

const getUsersByMajorId = async (client, majorId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "user" u
    WHERE (u.first_major_id = $1 OR u.second_major_id = $1)
    AND is_deleted = false
        `,
    [majorId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  createUser,
  getUserByNickname,
  updateUserByIsReviewed,
  getUserByFirstMajorId,
  getUserByUserId,
  getUserByFirebaseId,
  getUsersByMajorId,
};
