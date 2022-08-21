const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./reviewPOST"));
router.delete("/:id", checkUser, require("./reviewDELETE"));
router.get("/:id", checkUser, require("./reviewDetailGET"));
router.get("/tag/list", checkUser, require("./reviewTagListGET"));
router.get("/major/:majorId", checkUser, require("./reviewMajorListGET"));
router.put("/:id", checkUser, require("./reviewPUT"));
router.get("/university/:universityId", checkUser, require("./reviewUniversityListGET"));

module.exports = router;
