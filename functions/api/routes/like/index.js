const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /like/:
 *   post:
 *     security:
 *       - jwt: []
 *     tags:
 *       - like
 *     summary: 좋아요 등록 / 취소
 *     description: 'type -> 후기: review,  과방, 커뮤니티: post'
 *     parameters: []
 *     responses:
 *       '200':
 *         description: 좋아요 업데이트 성공
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
 *               targetId:
 *                 type: number
 *                 example: 123
 *               type:
 *                 type: string
 *                 example: review
 */
router.post("/", checkUser, require("./likePOST"));

module.exports = router;
