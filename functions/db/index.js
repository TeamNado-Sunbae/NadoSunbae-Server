// db와 상호작용하는 코드
module.exports = {
  userDB: require("./user"),
  universityDB: require("./university"),
  majorDB: require("./major"),
  reviewDB: require("./review"),
  postDB: require("./post"),
  tagDB: require("./tag"),
  relationReviewTagDB: require("./relationReviewTag"),
  likeDB: require("./like"),
  commentDB: require("./comment"),
  notificationDB: require("./notification"),
  reportDB: require("./report"),
  blockDB: require("./block"),
  inappropriateReviewDB: require("./inappropriateReview"),
};
