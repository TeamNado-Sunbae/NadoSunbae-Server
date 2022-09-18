const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const updateFavorites = async (client, majorId, userId) => {
  const { rows: existingRows } = await client.query(
    `
      SELECT * FROM favorites
      WHERE major_id = $1
      AND user_id = $2
      AND is_deleted = false
      `,
    [majorId, userId],
  );

  if (existingRows.length === 0) {
    const { rows } = await client.query(
      `
        INSERT INTO favorites
        (major_id, user_id)
        VALUES
        ($1, $2)
        RETURNING major_id, user_id, is_deleted
        `,
      [majorId, userId],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  } else {
    const { rows } = await client.query(
      `
          UPDATE favorites
          SET updated_at = now(),
          is_deleted = CASE WHEN is_deleted = true THEN false ELSE true END
          WHERE major_id = $1
          AND user_id = $2
          RETURNING major_id, user_id, is_deleted
          `,
      [majorId, userId],
    );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  }
};

module.exports = {
  updateFavorites,
};
