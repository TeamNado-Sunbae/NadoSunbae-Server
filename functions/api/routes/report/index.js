const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/post", checkUser, require("./reportPostPOST"));

module.exports = router;
