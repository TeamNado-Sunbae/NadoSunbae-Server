const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /favorites/:
 *   post:
 *     security:
 *       - jwt: []
 *     tags:
 *       - favorites
 *     summary: 학과 즐겨찾기 등록 / 취소
 *     parameters: []
 *     responses:
 *       '200':
 *         description: 즐겨찾기 업데이트 성공
 *       '400':
 *         description: 필요한 값 누락, 타입 에러
 *       '500':
 *         description: 서버 내부 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               majorId:
 *                 type: int
 *                 example: 2
 */
router.post("/", checkUser, require("./favoritesPOST"));

module.exports = router;
