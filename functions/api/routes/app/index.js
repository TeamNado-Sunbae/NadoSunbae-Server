const express = require("express");
const router = express.Router();
const { checkUser } = require("../../../middlewares/auth");

router.get("/link", require("./appLinkGET"));
router.get("/banner", require("./bannerListGET"));
router.get("/version/recent", require("./versionRecentGET"));

module.exports = router;
