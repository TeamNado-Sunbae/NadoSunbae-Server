const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/:userId", checkUser, require("./userMypageGET"));
router.get("/:userId/classroom-post/list", checkUser, require("./userMypageClassroomPostListGET"));
router.get("/list/major/:majorId", checkUser, require("./userListMajorGET"));
router.get("/:userId/review-post/list", checkUser, require("./userMypageReviewPostListGET"));
router.put("/", checkUser, require("./userMypagePUT"));
router.get("/app-version/recent", checkUser, require("./userMypageAppVersionRecentGET"));

module.exports = router;
