const express = require("express");
const router = express.Router();

router.get("/link", require("./appLinkGET"));
router.get("/banner", require("./bannerGET"));

module.exports = router;
