const express = require("express");
const router = express.Router();

router.post("/duplication-check/nickname", require("./authDuplicationCheckNicknamePOST"));
router.post("/duplication-check/email", require("./authDuplicationCheckEmailPOST"));
router.post("/signup", require("./authSignupPOST"));
router.post("/login", require("./authLoginPOST"));

module.exports = router;
