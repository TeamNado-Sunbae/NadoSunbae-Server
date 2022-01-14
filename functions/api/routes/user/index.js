const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/:userId/classroom-post/list", checkUser, require("./userMypageClassroomPostListGET"));

module.exports = router;
