const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createReport = async (
  client,
  reportUserId,
  reportedUserId,
  reportedTargetId,
  reportedTargetTypeId,
  reason,
) => {
  const { rows } = await client.query(
    `
      INSERT INTO report
      (report_user_id, reported_user_id, reported_target_id, reported_target_type_id, reason)
      VALUES
      ($1, $2, $3, $4, $5)
      RETURNING *
      `,
    [reportUserId, reportedUserId, reportedTargetId, reportedTargetTypeId, reason],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getReportByReportUser = async (
  client,
  reportUserId,
  reportedTargetId,
  reportedTargetTypeId,
) => {
  const { rows } = await client.query(
    `
  SELECT * FROM report
  WHERE report_user_id = $1
  AND reported_target_id = $2
  AND reported_target_type_id = $3
  AND is_deleted = false
  `,
    [reportUserId, reportedTargetId, reportedTargetTypeId],
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

const getReportListByReportedTarget = async (client, reportedTargetId, reportedTargetTypeId) => {
  const { rows } = await client.query(
    `
  SELECT id FROM report
  WHERE reported_target_id = $1
  AND reported_target_type_id = $2
  AND is_reported = false
  AND is_deleted = false
  `,
    [reportedTargetId, reportedTargetTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updateReportListByIsReported = async (client, reportIdList, isReported) => {
  const { rows: existingRows } = await client.query(
    `
      SELECT * FROM report
      WHERE id IN (${reportIdList.join()})
      AND is_deleted = FALSE
      `,
  );

  if (existingRows.length !== reportIdList.length) return false;

  const { rows } = await client.query(
    `
      UPDATE report
      SET is_reported = $1, updated_at = now()
      WHERE id IN (${reportIdList.join()})
      AND is_deleted = FALSE
      RETURNING *
      `,
    [isReported],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  createReport,
  getReportByReportUser,
  getReportListByReportedUser,
  getReportListByReportedTarget,
  updateReportListByIsReported,
};
