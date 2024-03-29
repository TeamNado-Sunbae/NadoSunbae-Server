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

const getNotificationList = async (client, receiverId, invisibleUserIds) => {
  const { rows } = await client.query(
    `
    SELECT n.id, n.post_id, p.major_id, m.major_name, n.comment_id, n.created_at, n.content, n.is_read, n.notification_type_id,
    n.sender_id,
    u.nickname sender_nickname,
    u.profile_image_id sender_profile_image_id
    FROM notification n
    INNER JOIN "user" u
    ON n.sender_id = u.id
    AND u.is_deleted = false
    AND n.receiver_id = $1
    AND n.is_deleted = false
    AND n.sender_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    LEFT JOIN post p on n.post_id = p.id
    LEFT JOIN major m on p.major_id = m.id
    ORDER BY n.created_at desc
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

const updateNotificationListByIsRead = async (client, postId, receiverId, isRead) => {
  const { rows } = await client.query(
    `
    UPDATE notification n
    SET is_read = $3, updated_at = now()
    WHERE post_id = $1
    AND receiver_id = $2
    AND is_deleted = false
    AND is_read = false
    RETURNING n.id, n.is_read
      `,
    [postId, receiverId, isRead],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteNotificationByNotificationId = async (client, notificationId) => {
  const { rows } = await client.query(
    `
    UPDATE notification
    SET is_deleted = true, updated_at = now()
    WHERE id = $1
    RETURNING *
    `,
    [notificationId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteNotificationListByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE notification
    SET is_deleted = true, updated_at = now()
    WHERE (sender_id = $1 OR receiver_id = $1)
    AND is_deleted = false
    RETURNING id, is_deleted, updated_at
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  createNotification,
  getNotificationList,
  getNotificationByNotificationId,
  updateNotificationListByIsRead,
  deleteNotificationByNotificationId,
  deleteNotificationListByUserSecession,
};
