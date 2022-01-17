const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.put("/:commentId", checkUser, require("./commentPUT"));
router.delete("/:commentId", checkUser, require("./commentDELETE"));

module.exports = router;
