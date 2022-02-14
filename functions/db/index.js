// db와 상호작용하는 코드
module.exports = {
  userDB: require("./user"),
  universityDB: require("./university"),
  majorDB: require("./major"),
  reviewPostDB: require("./reviewPost"),
  classroomPostDB: require("./classroomPost"),
  postTypeDB: require("./postType"),
  tagDB: require("./tag"),
  relationReviewPostTagDB: require("./relationReviewPostTag"),
  likeDB: require("./like"),
  imageDB: require("./image"),
  commentDB: require("./comment"),
  notificationDB: require("./notification"),
  reportDB: require("./report"),
};
