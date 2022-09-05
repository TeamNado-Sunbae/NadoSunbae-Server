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

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [auth]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *               email:
 *                 type: string
 *                 example: wngus4296@swu.ac.kr
 *               nickname:
 *                 type: string
 *                 example: juhyeon
 *               password:
 *                 type: string
 *                 example: '123456'
 *               universityId:
 *                 type: string
 *                 example: '1'
 *               firstMajorId:
 *                 type: string
 *                 example: '23'
 *               firstMajorStart:
 *                 type: string
 *                 example: 19-1
 *               secondMajorId:
 *                 type: string
 *                 example: '24'
 *               secondMajorStart:
 *                 type: string
 *                 example: 20-2
 *     responses:
 *       201:
 *         description: 회원가입 및 이메일 전송 성공
 *       400:
 *         description: 필요한 값 누락
 *       500:
 *         description: 서버 내부 에러
 */
router.post("/signup", require("./authSignupPOST"));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - auth
 *     summary: 로그인
 *     description: ''
 *     parameters: []
 *     responses:
 *       '200':
 *         description: 로그인 성공
 *       '202':
 *         description: 이메일 인증되지 않은 유저
 *       '400':
 *         description: 필요한 값 누락
 *       '404':
 *         description: 해당 유저 없음, 이메일 에러, 패스워드 에러
 *       '500':
 *         description: 서버 내부 에러, 토큰 업데이트 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: wngus4296@swu.ac.kr
 *               password:
 *                 type: string
 *                 example: '123456'
 *               deviceToken:
 *                 type: string
 *                 example: abcdefg
 */
router.post("/login", require("./authLoginPOST"));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     security:
 *       - jwt: []
 *     tags:
 *       - auth
 *     summary: 로그아웃
 *     description: ''
 *     parameters: []
 *     responses:
 *       '200':
 *         description: 로그아웃 성공
 *       '500':
 *         description: 서버 내부 에러, 토큰 업데이트 에러
 */
router.post("/logout", checkUser, require("./authLogoutPOST"));

/**
 * @swagger
 * /auth/renewal/token:
 *   post:
 *     tags:
 *       - auth
 *     summary: 토큰 재발급 / 자동 로그인
 *     description: ''
 *     parameters:
 *       - name: refreshtoken
 *         in: header
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 토큰 업데이트 및 로그인 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '401':
 *         description: 토큰 에러 및 만료
 *       '500':
 *         description: 서버 내부 에러, 토큰 업데이트 에러
 */
router.post("/renewal/token", require("./authRenewalTokenPOST"));

/**
 * @swagger
 * /auth/reset/password:
 *   post:
 *     tags:
 *       - auth
 *     summary: 비밀번호 재설정
 *     description: ''
 *     parameters: []
 *     responses:
 *       '200':
 *         description: 비밀번호 초기화 이메일 전송 성공
 *       '400':
 *         description: 필요한 값 누락, 해당 이메일로 가입된 유저 없음
 *       '500':
 *         description: 서버 내부 에러, 이메일 전송 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: wngus4296@swu.ac.kr
 */
router.post("/reset/password", require("./authResetPasswordPOST"));

/**
 * @swagger
 * /auth/university/{universityId}:
 *   get:
 *     tags:
 *       - auth
 *     summary: 학교별 이메일 뒷자리 조회
 *     description: 회원가입 - 이메일 인증에 필요한 학교별 이메일 뒷자리를 조회합니다.
 *     parameters:
 *       - name: universityId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: 1
 *     responses:
 *       '200':
 *         description: 해당 학교 이메일 뒷자리 조회 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '404':
 *         description: 해당 학교 이메일 없음
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/university/:universityId", require("./authUniversityGET"));

/**
 * @swagger
 * /auth/certification/email:
 *   post:
 *     tags:
 *       - auth
 *     summary: 이메일 인증
 *     description: ''
 *     parameters: []
 *     responses:
 *       '200':
 *         description: 이메일 인증 메일 전송 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '500':
 *         description: 서버 내부 에러, 이메일 전송 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: wngus4296@swu.ac.kr
 *               password:
 *                 type: string
 *                 example: '123456'
 */
router.post("/certification/email", require("./authCertificationEmailPOST"));

/**
 * @swagger
 * /auth/secession:
 *   post:
 *     security:
 *       - jwt: []
 *     tags:
 *       - auth
 *     summary: 회원 탈퇴
 *     description: ''
 *     parameters: []
 *     responses:
 *       '200':
 *         description: 유저 탈퇴 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '401':
 *         description: 패스워드 오류
 *       '500':
 *         description: 서버 내부 에러, 유저 삭제 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 example: '123456'
 */
router.post("/secession", checkUser, require("./authSecessionPOST"));

module.exports = router;
