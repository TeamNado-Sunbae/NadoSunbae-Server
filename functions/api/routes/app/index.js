const express = require("express");
const router = express.Router();

router.get("/link", require("./appLinkGET"));
router.get("/banner", require("./bannerListGET"));
router.get("/version/recent", require("./versionRecentGET"));

module.exports = router;
