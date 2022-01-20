const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const createNotification = async (
  client,
  postId,
  notificationType,
  senderId,
  receiverId,
  content,
) => {
  const { rows } = await client.query(
    `
        INSERT INTO notification
        (post_id, notification_type, sender_id, receiver_id, content)
        VALUES
        ($1, $2, $3, $4, $5)
        RETURNING *
        `,
    [postId, notificationType, senderId, receiverId, content],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getNotificationListByReceiverId = async (client, receiverId) => {
  const { rows } = await client.query(
    `
  SELECT * FROM notification
  WHERE receiver_id = $1
  AND is_deleted = false
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

module.exports = {
  createNotification,
  getNotificationListByReceiverId,
  getNotificationByNotificationId,
  updateNotificationByIsRead,
  deleteNotificationByNotificationId,
};
