const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/:postId", checkUser, require("./reviewPostDetailGET"));
router.get("/tag/list", require("./reviewPostTagListGET"));

module.exports = router;
