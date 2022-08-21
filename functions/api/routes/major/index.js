const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/university/:universityId", require("./majorListGET"));
router.get("/:majorId", checkUser, require("./majorGET"));

module.exports = router;
