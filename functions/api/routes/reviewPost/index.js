const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/background-image/list", require("./reviewPostBackgroundImageListGET"));
router.post("/", checkUser, require("./reviewPostPOST"));

module.exports = router;
