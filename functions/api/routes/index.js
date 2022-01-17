const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/user/mypage", require("./user"));
router.use("/review-post", require("./reviewPost"));
router.use("/classroom-post", require("./classroomPost"));
router.use("/major", require("./major"));
router.use("/comment", require("./comment"));
router.use("/like", require("./like"));
router.use("/report", require("./report"));

module.exports = router;
