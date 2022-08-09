const postType = {
  GENERAL: 1,
  INFORMATION: 2,
  QUESTION_TO_EVERYONE: 3,
  QUESTION_TO_PERSON: 4,
};

const likeType = {
  REVIEW: 1,
  POST: 2,
};

const reportType = {
  REVIEW: 1,
  POST: 2,
  COMMENT: 3,
};

const notificationType = {
  QUESTION_TO_PERSON_ALARM: 1,
  MY_QUESTION_COMMENT_ALARM: 2,
  MY_INFORMATION_COMMENT_ALARM: 3,
  OTHER_QUESTION_COMMENT_ALARM: 4,
  OTHER_INFORMATION_COMMENT_ALARM: 5,
};

module.exports = { postType, reportType, notificationType, likeType };
