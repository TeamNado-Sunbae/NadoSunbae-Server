const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./reviewPOST"));
router.delete("/:id", checkUser, require("./reviewDELETE"));
router.get("/:id", checkUser, require("./reviewDetailGET"));
router.get("/tag", checkUser, require("./reviewTagListGET"));
router.put("/:id", checkUser, require("./reviewPUT"));
router.get("/university/:universityId", checkUser, require("./reviewUniversityListGET"));
router.post("/major", checkUser, require("./reviewMajorListPOST"));

module.exports = router;
