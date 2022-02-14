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

const getExistingReport = async (client, reportUserId, reportedTargetId, reportedTargetTypeId) => {
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

module.exports = {
  createReport,
  getExistingReport,
};
