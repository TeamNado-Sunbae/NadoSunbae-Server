const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/duplication-check/nickname", require("./authDuplicationCheckNicknamePOST"));
router.post("/duplication-check/email", require("./authDuplicationCheckEmailPOST"));
router.post("/signup", require("./authSignupPOST"));
router.post("/login", require("./authLoginPOST"));
router.post("/logout", checkUser, require("./authLogoutPOST"));
// 토큰 갱신, 자동 로그인에 사용하는 api
router.post("/renewal/token", require("./authRenewalTokenPOST"));
router.post("/reset/password", require("./authResetPasswordPOST"));
router.get("/university/:universityId", require("./authUniversityGET"));
router.post("/certification/email", require("./authCertificationEmailPOST"));
router.post("/secession", checkUser, require("./authSecessionPOST"));

module.exports = router;
