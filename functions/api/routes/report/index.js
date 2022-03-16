const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./reportPOST"));
router.put("/:reportId", checkUser, require("./reportPUT"));

module.exports = router;
