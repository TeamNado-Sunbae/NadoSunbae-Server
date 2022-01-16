const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./classroomPostPOST"));
router.delete("/:postId", checkUser, require("./classroomPostDELETE"));
router.get("/information/:postId", checkUser, require("./classroomPostInformationGET"));
router.get("/question/:postId", checkUser, require("./classroomPostQuestionGET"));

module.exports = router;
