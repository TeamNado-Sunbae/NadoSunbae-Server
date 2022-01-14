const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/comment", checkUser, require("./reportCommentPOST"));

module.exports = router;
