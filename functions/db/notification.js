const _ = require("lodash");
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

module.exports = {
  createNotification,
};
