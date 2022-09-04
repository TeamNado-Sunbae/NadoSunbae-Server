const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /auth/duplication-check/nickname:
 *   post:
 *     summary: 닉네임 중복 체크
 *     tags: [auth]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  nickname:
 *                     type: string
 *                     example: juhyeon
 *     responses:
 *       200:
 *         description: 사용 가능한 닉네임
 *       400:
 *         description: 필요한 값 누락
 *       409:
 *         description: 이미 사용 중인 닉네임
 *       500:
 *         description: 서버 내부 에러
 */
router.post("/duplication-check/nickname", require("./authDuplicationCheckNicknamePOST"));

/**
 * @swagger
 * /auth/duplication-check/email:
 *   post:
 *     summary: 이메일 중복 체크
 *     tags: [auth]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                 email:
 *                   type: string
 *                   example: wngus4296@swu.ac.kr
 *     responses:
 *       200:
 *         description: 사용 가능한 이메일
 *       400:
 *         description: 필요한 값 누락
 *       409:
 *         description: 이미 사용 중인 이메일
 *       500:
 *         description: 서버 내부 에러
 */
router.post("/duplication-check/email", require("./authDuplicationCheckEmailPOST"));
router.post("/signup", require("./authSignupPOST"));
router.post("/login", require("./authLoginPOST"));
router.post("/logout", checkUser, require("./authLogoutPOST"));
router.post("/renewal/token", require("./authRenewalTokenPOST"));
router.post("/reset/password", require("./authResetPasswordPOST"));
router.get("/university/:universityId", require("./authUniversityGET"));
router.post("/certification/email", require("./authCertificationEmailPOST"));
router.post("/secession", checkUser, require("./authSecessionPOST"));

module.exports = router;
