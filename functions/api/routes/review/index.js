const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./reviewPOST"));
router.delete("/:id", checkUser, require("./reviewDELETE"));
router.get("/:id", checkUser, require("./reviewDetailGET"));
router.get("/tag", checkUser, require("./reviewTagListGET"));
router.post("/", checkUser, require("./reviewListPOST"));
router.put("/:id", checkUser, require("./reviewPUT"));

module.exports = router;
