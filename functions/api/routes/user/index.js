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
<<<<<<< HEAD
router.get("/classroom-post/list", checkUser, require("./userMypageClassroomPostListGET"));
=======
router.put("/", checkUser, require("./userMypagePUT"));
>>>>>>> 44e5940068d17ad4b36c8f6b1b892af614d041b6
router.get("/app-version/recent", checkUser, require("./userMypageAppVersionRecentGET"));

module.exports = router;
