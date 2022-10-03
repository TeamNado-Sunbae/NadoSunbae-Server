const _ = require("lodash");
const convertSnakeToCamel = require("../lib/convertSnakeToCamel");

const deletePostByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
      UPDATE post p
      SET is_deleted = true, updated_at = now()
      WHERE id = $1
      RETURNING id as post_id, is_deleted
      `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getPostListByAnswererId = async (
  client,
  answererId,
  userId,
  likeTypeId,
  invisibleUserIds,
) => {
  const { rows } = await client.query(
    `
      SELECT p.id, p.post_type_id, p.title, p.content, p.created_at, p.writer_id, u.nickname, m.major_name,
      (
        SELECT cast(count(c.*) as integer) comment_count FROM comment c
        WHERE c.post_id = p.id
        AND c.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
        AND c.is_deleted = false
        AND p.is_deleted = false
      ),
      (
        SELECT cast(count(l.*) as integer) AS like_count FROM "like" l
        WHERE l.target_id = p.id
        AND l.target_type_id = $3
        AND l.is_liked = true
        AND p.is_deleted = false
      ),
      (
        coalesce(
          (
            SELECT l.is_liked FROM "like" l
            WHERE l.target_id = p.id
            AND l.target_type_id = $3
            AND l.user_id = $2
            AND p.is_deleted = false
          ), false
        )
      ) as is_liked
      FROM post p
      INNER JOIN major m
      ON p.major_id = m.id
      AND m.is_deleted = false
      INNER JOIN "user" u
      ON p.writer_id = u.id
      AND u.is_deleted = false
      WHERE p.answerer_id = $1
      AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
      AND p.is_deleted = false
      ORDER BY p.created_at desc
          `,
    [answererId, userId, likeTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getPostByPostId = async (client, postId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM post 
    WHERE id = $1
      AND is_deleted = false
    `,
    [postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getPostListByNotification = async (client) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.is_deleted
    FROM post p
    INNER JOIN "user" u
    ON p.writer_id = u.id
    AND u.is_deleted = false
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const createPost = async (client, majorId, writerId, answererId, postTypeId, title, content) => {
  const { rows } = await client.query(
    `
    INSERT INTO post
    (major_id, writer_id ,answerer_id, post_type_id, title, content)
    VALUES
    ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [majorId, writerId, answererId, postTypeId, title, content],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updatePost = async (client, title, content, postId) => {
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM post p
    WHERE id = $1
       AND is_deleted = false
    `,
    [postId],
  );

  if (existingRows.length === 0) return false;

  const data = _.merge({}, convertSnakeToCamel.keysToCamel(existingRows[0]), { title, content });

  const { rows } = await client.query(
    `
    UPDATE post p
    SET title = $1, content = $2, updated_at = now()
    WHERE id = $3
    RETURNING * 
    `,
    [data.title, data.content, postId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getPostList = async (
  client,
  universityId,
  majorId,
  postTypeIds,
  userId,
  likeTypeId,
  search,
  invisibleUserIds,
) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.post_type_id, p.title, p.content, p.created_at, p.answerer_id, p.writer_id, u.nickname, m.major_name,
    (
      SELECT cast(count(c.*) as integer) comment_count FROM comment c
      WHERE c.post_id = p.id
      AND c.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
      AND c.is_deleted = false
      AND p.is_deleted = false
    ),
    (
      SELECT cast(count(l.*) as integer) AS like_count FROM "like" l
      WHERE l.target_id = p.id
      AND l.target_type_id = $4
      AND l.is_liked = true
      AND p.is_deleted = false
    ),
    (
      coalesce(
        (
          SELECT l.is_liked FROM "like" l
          WHERE l.target_id = p.id
          AND l.target_type_id = $4
          AND l.user_id = $3
          AND p.is_deleted = false
        ), false
      )
    ) as is_liked
  FROM "post" p
  INNER JOIN major m
    ON p.major_id = m.id
    AND m.university_id = $1
    AND m.is_deleted = false
  INNER JOIN "user" u
    ON p.writer_id = u.id
    AND u.is_deleted = false
  AND p.major_id = (CASE WHEN $2 <> 0 then $2 else p.major_id end)
  AND p.post_type_id IN (${postTypeIds.join()})
  AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
  AND p.is_deleted = false
  AND (p.title LIKE '%${search}%'
  OR p.content LIKE '%${search}%')
  ORDER BY p.created_at desc
  `,
    [universityId, majorId, userId, likeTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getPostListByWriterId = async (
  client,
  writerId,
  likeTypeId,
  postTypeIds,
  invisibleUserIds,
) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.post_type_id, p.title, p.content, p.created_at, p.writer_id, u.nickname, m.major_name,
    (
      SELECT cast(count(c.*) as integer) comment_count FROM comment c
      WHERE c.post_id = p.id
      AND c.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
      AND c.is_deleted = false
      AND p.is_deleted = false
    ),
    (
      SELECT cast(count(l.*) as integer) AS like_count FROM "like" l
      WHERE l.target_id = p.id
      AND l.target_type_id = $2
      AND l.is_liked = true
      AND p.is_deleted = false
    ),
    (
      coalesce(
        (
          SELECT l.is_liked FROM "like" l
          WHERE l.target_id = p.id
          AND l.target_type_id = $2
          AND l.user_id = $1
          AND p.is_deleted = false
        ), false
      )
    ) as is_liked
    FROM "post" p
    INNER JOIN major m
    ON p.major_id = m.id
    AND m.is_deleted = false
    INNER JOIN "user" u
    ON p.writer_id = u.id
    AND u.is_deleted = false
    AND p.writer_id = $1
    AND p.post_type_id IN (${postTypeIds.join()})
    AND p.is_deleted = false
    ORDER BY p.created_at desc
  `,
    [writerId, likeTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deletePostListByUserSecession = async (client, userId) => {
  const { rows } = await client.query(
    `
    UPDATE post
    SET is_deleted = true, updated_at = now()
    WHERE writer_id = $1
    AND is_deleted = false
    RETURNING id, is_deleted, updated_at
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getPostListByLike = async (client, userId, likeTypeId, postTypeIds, invisibleUserIds) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.post_type_id, p.title, p.content, p.created_at, p.writer_id, u.nickname, m.major_name,
    (
      SELECT cast(count(c.*) as integer) comment_count FROM comment c
      WHERE c.post_id = p.id
      AND c.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
      AND c.is_deleted = false
      AND p.is_deleted = false
    ),
    (
      SELECT cast(count(l.*) as integer) AS like_count FROM "like" l
      WHERE l.target_id = p.id
      AND l.target_type_id = $2
      AND l.is_liked = true
      AND p.is_deleted = false
    )
    FROM post p
    INNER JOIN "like" l
    ON l.target_id = p.id
    AND l.target_type_id = $2
    AND l.user_id = $1
    AND l.is_liked = true
    INNER JOIN major m
    ON p.major_id = m.id
    AND m.is_deleted = false
    INNER JOIN "user" u
    ON p.writer_id = u.id
    AND u.is_deleted = false
    WHERE p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    AND p.post_type_id IN (${postTypeIds.join()})
    AND p.is_deleted = false
    ORDER BY l.updated_at desc
  `,
    [userId, likeTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getPostListByComment = async (
  client,
  commentWriterId,
  likeTypeId,
  postTypeIds,
  invisibleUserIds,
) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.post_type_id, p.title, p.content, p.created_at, p.writer_id, u.nickname, m.major_name,
    (
      SELECT cast(count(c.*) as integer) comment_count FROM comment c
      WHERE c.post_id = p.id
      AND c.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
      AND c.is_deleted = false
      AND p.is_deleted = false
    ),
    (
      SELECT cast(count(l.*) as integer) AS like_count FROM "like" l
      WHERE l.target_id = p.id
      AND l.target_type_id = $2
      AND l.is_liked = true
      AND p.is_deleted = false
    ),
    (
      coalesce(
        (
          SELECT l.is_liked FROM "like" l
          WHERE l.target_id = p.id
          AND l.target_type_id = $2
          AND l.user_id = $1
          AND p.is_deleted = false
        ), false
      )
    ) as is_liked
    FROM post p
    INNER JOIN "comment" c
    ON c.post_id = p.id
    AND c.writer_id = $1
    AND c.is_deleted = false
    INNER JOIN major m
    ON p.major_id = m.id
    AND m.is_deleted = false
    INNER JOIN "user" u
    ON p.writer_id = u.id
    AND u.is_deleted = false
    WHERE p.writer_id != $1
    AND p.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
    AND p.post_type_id IN (${postTypeIds.join()})
    AND p.is_deleted = false
    ORDER BY p.created_at desc
      `,
    [commentWriterId, likeTypeId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getPostDetailByPostId = async (client, postId, userId, likeTypeId, invisibleUserIds) => {
  const { rows } = await client.query(
    `
    SELECT p.id, p.post_type_id, p.title, p.content, p.created_at, m.major_name,
    p.writer_id, p.answerer_id, u.profile_image_id, u.nickname, u.first_major_start, u.second_major_start, m1.major_name first_major_name, m2.major_name second_major_name,
    (
      SELECT cast(count(c.*) as integer) comment_count FROM comment c
      WHERE c.post_id = p.id
      AND c.writer_id <> all (ARRAY[${invisibleUserIds.join()}]::int[])
      AND c.is_deleted = false
      AND p.is_deleted = false
    ),
    (
      SELECT cast(count(l.*) as integer) AS like_count FROM "like" l
      WHERE l.target_id = p.id
      AND l.target_type_id = $2
      AND l.is_liked = true
      AND p.is_deleted = false
    ),
    (
      coalesce(
        (
          SELECT l.is_liked FROM "like" l
          WHERE l.target_id = p.id
          AND l.target_type_id = $2
          AND l.user_id = $3
          AND p.is_deleted = false
        ), false
      )
    ) as is_liked
    FROM post p
    INNER JOIN major m
      ON p.major_id = m.id
      AND m.is_deleted = false
    INNER JOIN "user" u
      ON p.writer_id = u.id
      AND u.is_deleted = false
    INNER JOIN major m1
      ON u.first_major_id = m1.id
      AND u.is_deleted = false
      AND m1.is_deleted = false
    INNER JOIN major m2
      ON u.second_major_id = m2.id
      AND u.is_deleted = false
      AND m2.is_deleted = false
    WHERE p.id = $1
    AND p.is_deleted = false
    `,
    [postId, likeTypeId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

// response rate policy (answered questionToPerson post cnt/questionToPerson post cnt) * 100
const calculateResponseRate = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT cast(COUNT(DISTINCT CASE WHEN p.answerer_id = c.writer_id THEN p.id END) * 100 / NULLIF(COUNT(DISTINCT p.id), 0) as integer) rate
    FROM post p
    LEFT JOIN "comment" c
    ON c.post_id = p.id
    AND c.is_deleted = false
    where p.is_deleted = false
    AND p.answerer_id = $1
      `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  createPost,
  deletePostByPostId,
  getPostListByAnswererId,
  getPostList,
  getPostByPostId,
  updatePost,
  getPostListByWriterId,
  deletePostListByUserSecession,
  getPostListByLike,
  getPostListByNotification,
  calculateResponseRate,
  getPostListByComment,
  getPostDetailByPostId,
};
