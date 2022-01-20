const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/", checkUser, require("./userMypageGET"));
router.get("/:userId", checkUser, require("./userMypageOtherGET"));
router.get("/:userId/classroom-post/list", checkUser, require("./userMypageClassroomPostListGET"));
router.get("/list/major/:majorId", checkUser, require("./userListMajorGET"));

module.exports = router;
