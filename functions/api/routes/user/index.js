const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/major/:majorId", checkUser, require("./userListMajorGET"));
router.get("/post", checkUser, require("./userMypagePostListGET"));
router.get("/comment", checkUser, require("./userMypageCommentListGET"));
router.get("/like", checkUser, require("./userMypageLikeListGET"));
router.get("/:userId/review", checkUser, require("./userMypageReviewListGET"));
router.get("/:userId/post/question", checkUser, require("./userMypagePostQuestionListGET"));
router.get("/:userId", checkUser, require("./userMypageGET"));
router.put("/", checkUser, require("./userMypagePUT"));

module.exports = router;
