const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("mypage/major/:majorId", checkUser, require("./userListMajorGET"));
router.get("/university/:universityId", checkUser, require("./userListUniversityGET"));
router.get("mypage/post", checkUser, require("./userMypagePostListGET"));
router.get("mypage/comment", checkUser, require("./userMypageCommentListGET"));
router.get("mypage/like", checkUser, require("./userMypageLikeListGET"));
router.get("mypage/:userId/review", checkUser, require("./userMypageReviewListGET"));
router.get("mypage/:userId/post/question", checkUser, require("./userMypagePostQuestionListGET"));
router.get("mypage/:userId", checkUser, require("./userMypageGET"));
router.put("mypage/", checkUser, require("./userMypagePUT"));

module.exports = router;
