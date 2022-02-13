const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/duplication-check/nickname", require("./authDuplicationCheckNicknamePOST"));
router.post("/duplication-check/email", require("./authDuplicationCheckEmailPOST"));
router.post("/signup", require("./authSignupPOST"));
router.post("/login", require("./authLoginPOST"));
router.post("/renewal/token", require("./authRenewalTokenPOST"));
router.post("/login/token", checkUser, require("./authLoginTokenPOST"));
router.get("/university/:universityId", require("./authUniversityGET"));

module.exports = router;
