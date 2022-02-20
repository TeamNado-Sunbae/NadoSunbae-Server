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

const updateNotificationsByIsRead = async (client, postId, receiverId, isRead) => {
  const { rows } = await client.query(
    `
    UPDATE notification
    SET is_read = $3, updated_at = now()
    WHERE post_id = $1
    AND receiver_id = $2
    AND is_deleted = false
    AND is_read = false
    RETURNING *
      `,
    [postId, receiverId, isRead],
  );
  return convertSnakeToCamel.keysToCamel(rows);
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
  updateNotificationsByIsRead,
  deleteNotificationByNotificationId,
};
