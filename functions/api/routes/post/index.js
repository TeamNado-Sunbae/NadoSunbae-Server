const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./postPOST"));
router.delete("/:postId", checkUser, require("./postDELETE"));
router.put("/:postId", checkUser, require("./postPUT"));
router.get("/:postId", checkUser, require("./postGET"));
router.get("/major/:majorId", checkUser, require("./postMajorListGET"));

module.exports = router;