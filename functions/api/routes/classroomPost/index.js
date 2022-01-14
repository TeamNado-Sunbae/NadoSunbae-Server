const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.delete("/:postId", checkUser, require("./classroomPostDELETE"));

module.exports = router;
