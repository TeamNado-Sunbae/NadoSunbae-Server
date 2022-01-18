const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const getUserByNickname = async (client, nickname) => {
  const { rows } = await client.query(
    `
      SELECT id, nickname FROM "user"
      WHERE nickname = $1
      AND is_deleted = false
      `,
    [nickname],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getUserByEmail = async (client, email) => {
  const { rows } = await client.query(
    `
      SELECT id, email FROM "user"
      WHERE email = $1
      AND is_deleted = false
      `,
    [email],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const createUser = async (
  client,
  email,
  nickname,
  profileImageId,
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
      (email, nickname, profile_image_id ,university_id, first_major_id, first_major_start, second_major_id, second_major_start, firebase_id)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,

    [
      email,
      nickname,
      profileImageId,
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

const updateUserByReport = async (client, userId) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    AND is_deleted = FALSE
    `,
    [userId],
  );

  if (existingRows.length === 0) return false;

  const { rows } = await client.query(
    `
    UPDATE "user"
    SET report_count = report_count + 1, updated_at = now()
    WHERE id = $1
    AND is_deleted = FALSE
    RETURNING *
    `,
    [userId],
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

const updatedUserByDeviceToken = async (client, userId, deviceToken) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    AND is_deleted = FALSE
    `,
    [userId],
  );

  if (existingRows.length === 0) return false;

  const { rows } = await client.query(
    `
    UPDATE "user"
    SET device_token = $2, updated_at = now()
    WHERE id = $1
    AND is_deleted = FALSE
    RETURNING *
    `,
    [userId, deviceToken],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  createUser,
  getUserByNickname,
  getUserByEmail,
  updateUserByIsReviewed,
  updateUserByReport,
  getUserByFirstMajorId,
  getUserByUserId,
  getUserByFirebaseId,
  getUsersByMajorId,
  updatedUserByDeviceToken,
};
