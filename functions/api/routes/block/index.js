const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/", checkUser, require("./blockListGET"));
router.post("/", checkUser, require("./blockPOST"));

module.exports = router;
