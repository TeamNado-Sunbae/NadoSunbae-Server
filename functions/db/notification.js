const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createNotification = async (
  client,
  senderId,
  receiverId,
  postId,
  notificationTypeId,
  content,
  commentId,
  postTypeId,
) => {
  const { rows } = await client.query(
    `
      INSERT INTO notification
      (sender_id, receiver_id, post_id, notification_type_id, content, comment_id, post_type_id)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
    [senderId, receiverId, postId, notificationTypeId, content, commentId, postTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getNotificationListByReceiverId = async (client, receiverId) => {
  const { rows } = await client.query(
    `
  SELECT * FROM notification
  WHERE receiver_id = $1
  AND is_deleted = false
  ORDER BY created_at desc
  `,
    [receiverId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getNotificationByNotificationId = async (client, notificationId) => {
  const { rows } = await client.query(
    `
  SELECT * FROM notification
  WHERE id = $1
  AND is_deleted = false
  `,
    [notificationId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateNotificationByIsRead = async (client, notificationId, isRead) => {
  const { rows: existingRows } = await client.query(
    `
      SELECT * FROM notification
      WHERE id = $1
      AND is_deleted = FALSE
      `,
    [notificationId],
  );

  if (existingRows.length === 0) return false;

  const { rows } = await client.query(
    `
    UPDATE notification
    SET is_read = $2, updated_at = now()
    WHERE id = $1
    AND is_deleted = false
    RETURNING *
      `,
    [notificationId, isRead],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteNotificationByNotificationId = async (client, notificationId) => {
  const { rows } = await client.query(
    `
    UPDATE notification
    SET is_deleted = TRUE, updated_at = now()
    WHERE id = $1
    RETURNING *
    `,
    [notificationId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteNotificationByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE notification
    SET is_deleted = true, updated_at = now()
    WHERE sender_id = $1 OR receiver_id = $1
    AND is_deleted = false
    RETURNING id, is_deleted, updated_at
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  createNotification,
  getNotificationListByReceiverId,
  getNotificationByNotificationId,
  updateNotificationByIsRead,
  deleteNotificationByNotificationId,
  deleteNotificationByUserSecession,
};
