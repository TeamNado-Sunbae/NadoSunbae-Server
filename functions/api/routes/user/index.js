const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/:userId", checkUser, require("./userMypageGET"));
router.get(
  "/:userId/classroom-post/list",
  checkUser,
  require("./userMypageClassroomPostQuestionListGET"),
);
router.get("/list/major/:majorId", checkUser, require("./userListMajorGET"));
router.get(
  "/classroom-post/list/:postTypeId",
  checkUser,
  require("./userMypageClassroomPostListGET"),
);

module.exports = router;
