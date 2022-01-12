const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/:postId", checkUser, require("./reviewPostDetailGET"));

module.exports = router;
