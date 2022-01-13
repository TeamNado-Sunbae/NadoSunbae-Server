const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/user", checkUser, require("./reportUserPOST"));

module.exports = router;
