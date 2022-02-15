const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/:userId", checkUser, require("./userMypageGET"));
router.get(
  "/:userId/classroom-post/list",
  checkUser,
  require("./userMypageClassroomPostQuestionListGET"),
);
router.get("/list/major/:majorId", checkUser, require("./userListMajorGET"));
<<<<<<< HEAD
router.get("/classroom-post/list", checkUser, require("./userMypageClassroomPostListGET"));
router.get("/review-post/list", checkUser, require("./userMypageReviewPostListGET"));
=======
router.get("/:userId/review-post/list", checkUser, require("./userMypageReviewPostListGET"));
>>>>>>> 36efa8a318f79e4eb914a159b0707d46b4e2a5da
router.put("/", checkUser, require("./userMypagePUT"));
router.get("/app-version/recent", checkUser, require("./userMypageAppVersionRecentGET"));
router.get("/comment/list/:postTypeId", checkUser, require("./userMypageCommentListGET"));

module.exports = router;
