const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/background-image/list", checkUser, require("./reviewPostBackgroundImageListGET"));

module.exports = router;
