const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/review-post", require("./reviewPost"));
router.use("/classroom-post", require("./classroomPost"));
router.use("/major", require("./major"));
router.use("/comment", require("./comment"));
router.use("/classroom-post", require("./classroomPost"));

module.exports = router;
