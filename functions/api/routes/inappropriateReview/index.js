const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /inappropriate-review/:
 *   post:
 *     security:
 *       - jwt: []
 *     tags:
 *       - inappropriate-review
 *     summary: 부적절 후기 등록
 *     description: admin 계정만 사용 가능합니다.
 *     parameters: []
 *     responses:
 *       '200':
 *         description: 부적절 후기 처리 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '403':
 *         description: 접근 권한 에러
 *       '404':
 *         description: 이미 삭제된 부적절 후기글, 해당 유저 없음
 *       '500':
 *         description: 서버 내부 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewId:
 *                 type: string
 *                 example: '4'
 *               reason:
 *                 type: string
 *                 example: 이유입니다.
 */
router.post("/", checkUser, require("./inappropriateReviewPOST"));

module.exports = router;
