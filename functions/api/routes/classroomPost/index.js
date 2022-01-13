const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/information/:postId", checkUser, require("./classroomPostInformationGET"));

module.exports = router;
