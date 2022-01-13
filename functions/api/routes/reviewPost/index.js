const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/background-image/list", require("./reviewPostBackgroundImageListGET"));

module.exports = router;
