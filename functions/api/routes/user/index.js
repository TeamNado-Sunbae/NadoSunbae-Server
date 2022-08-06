const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/major/:majorId", checkUser, require("./userListMajorGET"));
router.get("/app-version/recent", checkUser, require("./userMypageAppVersionRecentGET"));
router.get("/post", checkUser, require("./userMypagePostListGET"));
router.get("/comment/:postTypeId", checkUser, require("./userMypageCommentListGET"));
router.get("/like", checkUser, require("./userMypageLikeListGET"));
router.get("/:userId/review", checkUser, require("./userMypageReviewListGET"));
router.get("/:userId/post", checkUser, require("./userMypagePostQuestionListGET"));
router.get("/:userId", checkUser, require("./userMypageGET"));
router.put("/", checkUser, require("./userMypagePUT"));

module.exports = router;
