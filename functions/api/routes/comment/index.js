const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./commentPOST"));
router.delete("/:commentId", checkUser, require("./commentDELETE"));

module.exports = router;
