const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./classroomPostPOST"));
router.get("/information/:postId", checkUser, require("./classroomPostInformationGET"));
router.get("/:postTypeId/major/:majorId/list", checkUser, require("./classroomPostMajorListGET"));

module.exports = router;
