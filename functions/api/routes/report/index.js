const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/post", checkUser, require("./reportPostPOST"));
router.post("/comment", checkUser, require("./reportCommentPOST"));
router.post("/user", checkUser, require("./reportUserPOST"));

module.exports = router;
