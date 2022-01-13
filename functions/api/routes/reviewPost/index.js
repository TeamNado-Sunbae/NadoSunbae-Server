const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./reviewPostPOST"));
router.delete("/:postId", checkUser, require("./reviewPostDELETE"));

module.exports = router;
