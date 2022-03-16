const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/list/major/:majorId", checkUser, require("./userListMajorGET"));
router.get("/app-version/recent", checkUser, require("./userMypageAppVersionRecentGET"));
router.get("/classroom-post/list", checkUser, require("./userMypageClassroomPostListGET"));
router.get("/comment/list/:postTypeId", checkUser, require("./userMypageCommentListGET"));
router.get("/like/list", checkUser, require("./userMypageLikeListGET"));
router.get("/:userId/review-post/list", checkUser, require("./userMypageReviewPostListGET"));
router.get(
  "/:userId/classroom-post/list",
  checkUser,
  require("./userMypageClassroomPostQuestionListGET"),
);
router.get("/:userId", checkUser, require("./userMypageGET"));
router.put("/", checkUser, require("./userMypagePUT"));

module.exports = router;
