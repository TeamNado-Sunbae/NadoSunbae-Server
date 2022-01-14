const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/user", require("./user"));
router.use("/review-post", require("./reviewPost"));
router.use("/major", require("./major"));

module.exports = router;
