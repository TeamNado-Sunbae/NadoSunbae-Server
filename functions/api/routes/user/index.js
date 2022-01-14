const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get(
  "/mypage/:userId/classroom-post/list",
  checkUser,
  require("./userMypageClassroomPostListGET"),
);

module.exports = router;
