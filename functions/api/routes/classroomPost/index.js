const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./classroomPostPOST"));
router.delete("/:postId", checkUser, require("./classroomPostDELETE"));
router.put("/:postId", checkUser, require("./classroomPostPUT"));
router.get("/information/:postId", checkUser, require("./classroomPostInformationGET"));
router.get("/question/:postId", checkUser, require("./classroomPostQuestionGET"));
router.get("/:postTypeId/major/:majorId/list", checkUser, require("./classroomPostMajorListGET"));

module.exports = router;
