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
    AND is_deleted = false
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

const getUserByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
      SELECT u.*, m1.major_name first_major_name, m2.major_name second_major_name
      FROM "user" u
      INNER JOIN major m1
        ON u.first_major_id = m1.id
        AND u.is_deleted = false
        AND m1.is_deleted = false
      INNER JOIN major m2
        ON u.second_major_id = m2.id
        AND u.is_deleted = false
        AND m2.is_deleted = false
      WHERE u.id = $1
      AND u.is_deleted = false
      `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getUserByFirebaseId = async (client, firebaseId) => {
  const { rows } = await client.query(
    `
    SELECT u.*, m1.major_name first_major_name, m2.major_name second_major_name
    FROM "user" u
    INNER JOIN major m1
      ON u.first_major_id = m1.id
      AND u.is_deleted = false
      AND m1.is_deleted = false
    INNER JOIN major m2
      ON u.second_major_id = m2.id
      AND u.is_deleted = false
      AND m2.is_deleted = false
    WHERE u.firebase_id = $1
    AND u.is_deleted = false
    `,
    [firebaseId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

// response rate policy (answered questionToPerson post cnt/questionToPerson post cnt) * 100
const getUserListByMajorId = async (client, majorId, reviewFilter, invisibleUserIds) => {
  const { rows } = await client.query(
    `
    SELECT u.id, u.is_on_question, u.profile_image_id, u.nickname,
    CASE WHEN u.first_major_id = $1 THEN true ELSE false END is_first_major,
    CASE WHEN u.first_major_id = $1 THEN u.first_major_start ELSE u.second_major_start END major_start,
    cast(COUNT(DISTINCT CASE WHEN p.answerer_id = c.writer_id THEN p.id END) * 100 / NULLIF(COUNT(DISTINCT p.id), 0) as integer) rate
    FROM "user" u
    LEFT JOIN post p
      ON p.answerer_id = u.id
      AND p.is_deleted = false
    LEFT JOIN "comment" c
      ON c.post_id = p.id
      AND c.is_deleted = false
    WHERE (u.first_major_id = $1 OR u.second_major_id = $1)
    AND u.is_reviewed IN (${reviewFilter.join()})
    AND u.id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    AND u.is_deleted = false
    GROUP BY u.id
    ORDER BY rate DESC NULLS LAST
        `,
    [majorId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

// response rate policy (answered questionToPerson post cnt/questionToPerson post cnt) * 100
const getUserListByUniversityId = async (client, universityId, invisibleUserIds) => {
  const { rows } = await client.query(
    `
    SELECT u.id, u.profile_image_id, u.nickname,
    (SELECT m.major_name from major m WHERE m.id = u.first_major_id) as first_major_name,
    u.first_major_start,
    (SELECT m.major_name from major m WHERE m.id = u.second_major_id) as second_major_name,
    u.second_major_start,
    cast(COUNT(DISTINCT CASE WHEN p.answerer_id = c.writer_id THEN p.id END) * 100 / NULLIF(COUNT(DISTINCT p.id), 0) as integer) rate
    FROM "user" u
    LEFT JOIN post p
      ON p.answerer_id = u.id
      AND p.is_deleted = false
    LEFT JOIN "comment" c
      ON c.post_id = p.id
      AND c.is_deleted = false
    WHERE u.university_id = $1
    AND u.id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    AND u.is_deleted = false
    GROUP BY u.id
    ORDER BY rate DESC NULLS LAST, u.is_reviewed DESC, u.nickname
        `,
    [universityId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updateUserByDeviceToken = async (client, userId, deviceToken) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    AND is_deleted = false
    `,
    [userId],
  );

  if (existingRows.length === 0) return false;

  const { rows } = await client.query(
    `
    UPDATE "user"
    SET device_token = $2, updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING *
    `,
    [userId, deviceToken],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateUserByRefreshToken = async (client, userId, refreshtoken) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    AND is_deleted = false
    `,
    [userId],
  );

  if (existingRows.length === 0) return false;

  const { rows } = await client.query(
    `
    UPDATE "user"
    SET refresh_token = $2, updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING *
    `,
    [userId, refreshtoken],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getUserListByCommentPostId = async (client, commentPostId, invisibleUserIds) => {
  const { rows } = await client.query(
    `
      SELECT DISTINCT u.id, u.device_token FROM "user" u
      INNER JOIN (SELECT DISTINCT writer_id FROM comment WHERE post_id = $1 AND writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[]) AND is_deleted = false) c
      ON c.writer_id = u.id
      AND u.is_deleted = false
      `,
    [commentPostId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updateUser = async (
  client,
  userId,
  profileImageId,
  nickname,
  bio,
  isOnQuestion,
  firstMajorId,
  firstMajorStart,
  secondMajorId,
  secondMajorStart,
  isNicknameUpdated,
) => {
  const { rows } = await client.query(
    `
    UPDATE "user"
    SET 
    profile_image_id = $2,
    nickname = $3,
    bio = $4,
    is_on_question = $5,
    first_major_id = $6, 
    first_major_start = $7, 
    second_major_id = $8,
    second_major_start = $9, 
    nickname_updated_at = (CASE WHEN $10 = true THEN now() ELSE nickname_updated_at END),
    updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING *
    `,
    [
      userId,
      profileImageId,
      nickname,
      bio,
      isOnQuestion,
      firstMajorId,
      firstMajorStart,
      secondMajorId,
      secondMajorStart,
      isNicknameUpdated,
    ],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getUserByRefreshToken = async (client, refreshtoken) => {
  const { rows } = await client.query(
    `
    SELECT u.*, m1.major_name first_major_name, m2.major_name second_major_name
    FROM "user" u
    INNER JOIN major m1
      ON u.first_major_id = m1.id
      AND u.is_deleted = false
      AND m1.is_deleted = false
    INNER JOIN major m2
      ON u.second_major_id = m2.id
      AND u.is_deleted = false
      AND m2.is_deleted = false
    WHERE u.refresh_token = $1
    AND u.is_deleted = false
    `,
    [refreshtoken],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateUserByReport = async (client, userId, reportCount) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    AND is_deleted = false
    `,
    [userId],
  );

  if (existingRows.length === 0) return false;

  const { rows } = await client.query(
    `
    UPDATE "user"
    SET report_count = $2, report_created_at = now(), updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING *
    `,
    [userId, reportCount],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateUserByLogout = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE "user"
    SET refresh_token = null, device_token = null, updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING *
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateUserByExpiredReport = async (client, userId, reportCreatedAt) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    AND is_deleted = false
    `,
    [userId],
  );

  if (existingRows.length === 0) return false;

  const { rows } = await client.query(
    `
    UPDATE "user"
    SET report_created_at = $2, updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING *
    `,
    [userId, reportCreatedAt],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteUserByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE "user"
    SET is_deleted = true, device_token = null, refresh_token = null, updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING *
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  createUser,
  getUserByNickname,
  getUserByEmail,
  updateUserByIsReviewed,
  getUserByUserId,
  getUserByFirebaseId,
  getUserListByMajorId,
  getUserListByUniversityId,
  updateUserByDeviceToken,
  updateUserByRefreshToken,
  getUserListByCommentPostId,
  updateUser,
  getUserByRefreshToken,
  updateUserByReport,
  updateUserByExpiredReport,
  updateUserByLogout,
  deleteUserByUserSecession,
};
