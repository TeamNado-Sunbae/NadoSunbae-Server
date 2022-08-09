const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createReport = async (
  client,
  reportUserId,
  reportedUserId,
  targetId,
  targetTypeId,
  reason,
) => {
  const { rows } = await client.query(
    `
      INSERT INTO report
      (report_user_id, reported_user_id, target_id, target_type_id, reason)
      VALUES
      ($1, $2, $3, $4, $5)
      RETURNING *
      `,
    [reportUserId, reportedUserId, targetId, targetTypeId, reason],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getReportByReportUser = async (client, reportUserId, targetId, targetTypeId) => {
  const { rows } = await client.query(
    `
  SELECT * FROM report
  WHERE report_user_id = $1
  AND target_id = $2
  AND target_type_id = $3
  AND is_deleted = false
  `,
    [reportUserId, targetId, targetTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getReportListByReportedUser = async (client, reportedUserId) => {
  const { rows } = await client.query(
    `
  SELECT id FROM report
  WHERE reported_user_id = $1
  AND is_reported = false
  AND is_deleted = false
  `,
    [reportedUserId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getReportListByTarget = async (client, targetId, targetTypeId) => {
  const { rows } = await client.query(
    `
  SELECT id FROM report
  WHERE target_id = $1
  AND target_type_id = $2
  AND is_reported = false
  AND is_deleted = false
  `,
    [targetId, targetTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updateReportListByIsReported = async (client, reportIdList, isReported) => {
  const { rows: existingRows } = await client.query(
    `
      SELECT * FROM report
      WHERE id IN (${reportIdList.join()})
      AND is_deleted = false
      `,
  );

  if (existingRows.length !== reportIdList.length) return false;

  const { rows } = await client.query(
    `
      UPDATE report
      SET is_reported = $1, updated_at = now()
      WHERE id IN (${reportIdList.join()})
      AND is_deleted = false
      RETURNING *
      `,
    [isReported],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteReportList = async (client, reportedUserId) => {
  const { rows } = await client.query(
    `
      UPDATE report
      SET is_deleted = true, updated_at = now()
      WHERE reported_user_id = $1
      AND is_reported = true
      AND is_deleted = false
      RETURNING *
      `,
    [reportedUserId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteReportListByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE report
    SET is_deleted = true, updated_at = now()
    WHERE (report_user_id = $1 OR reported_user_id = $1)
    AND is_deleted = false
    RETURNING id, is_deleted, updated_at
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  createReport,
  getReportByReportUser,
  getReportListByReportedUser,
  getReportListByTarget,
  updateReportListByIsReported,
  deleteReportList,
  deleteReportListByUserSecession,
};
