const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /block/:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - block
 *     summary: 차단 리스트 조회
 *     description: ''
 *     parameters: []
 *     responses:
 *       '200':
 *         description: 차단 리스트 조회 성공
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/", checkUser, require("./blockListGET"));

/**
 * @swagger
 * /block/:
 *   post:
 *     security:
 *       - jwt: []
 *     tags:
 *       - block
 *     summary: 차단 등록
 *     description: ''
 *     parameters: []
 *     responses:
 *       '201':
 *         description: 차단 등록 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '500':
 *         description: 서버 내부 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blockedUserId:
 *                 type: number
 *                 example: 1
 */
router.post("/", checkUser, require("./blockPOST"));

module.exports = router;
