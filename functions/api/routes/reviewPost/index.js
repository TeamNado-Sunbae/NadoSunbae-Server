const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./reviewPostPOST"));

router.delete("/:postId", checkUser, require("./reviewPostDELETE"));
router.get("/:postId", checkUser, require("./reviewPostDetailGET"));
router.get("/tag/list", checkUser, require("./reviewPostTagListGET"));
router.post("/list", checkUser, require("./reviewPostListPOST"));
router.put("/:postId", checkUser, require("./reviewPostPUT"));

module.exports = router;
