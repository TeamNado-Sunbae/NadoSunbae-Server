const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/link", require("./appLinkGET"));

module.exports = router;
