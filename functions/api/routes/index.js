const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/user/mypage", require("./user"));
router.use("/review-post", require("./reviewPost"));
router.use("/post", require("./post"));
router.use("/major", require("./major"));
router.use("/comment", require("./comment"));
router.use("/like", require("./like"));
router.use("/report", require("./report"));
router.use("/notification", require("./notification"));
router.use("/block", require("./block"));
router.use("/inappropriate-review-post", require("./inappropriateReviewPost"));
router.use("/app", require("./app"));

module.exports = router;
