const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./reviewPostPOST"));
router.get("/:postId", checkUser, require("./reviewPostDetailGET"));
router.get("/tag/list", checkUser, require("./reviewPostTagListGET"));

module.exports = router;
