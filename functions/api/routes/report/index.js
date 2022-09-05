const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /report/:
 *   post:
 *     security:
 *       - jwt: []
 *     tags:
 *       - report
 *     summary: 신고 등록
 *     description: 'type -> 후기: review, 글: post, 댓글: comment'
 *     parameters: []
 *     responses:
 *       '201':
 *         description: 신고 성공
 *       '400':
 *         description: 필요한 값 누락, 타입 에러
 *       '404':
 *         description: 해당 게시글 또는 댓글 없음
 *       '409':
 *         description: 재신고 불가
 *       '500':
 *         description: 서버 내부 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetId:
 *                 type: string
 *                 example: '10'
 *               type:
 *                 type: string
 *                 example: comment
 *               reason:
 *                 type: string
 *                 example: 이유입니다
 */
router.post("/", checkUser, require("./reportPOST"));

/**
 * @swagger
 * /report/{reportId}:
 *   put:
 *     security:
 *       - jwt: []
 *     tags:
 *       - report
 *     summary: 신고 수정
 *     description: admin 계정만 사용 가능합니다.
 *     parameters:
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: '1'
 *     responses:
 *       '200':
 *         description: 신고 수정 성공
 *       '400':
 *         description: 필요한 값 누락, 타입 에러
 *       '403':
 *         description: admin 계정 아님
 *       '404':
 *         description: 해당 게시글 또는 댓글 없음, 게시글 - 태그 관계 삭제 에러, 해당 유저 없음
 *       '500':
 *         description: 서버 내부 에러
 */
router.put("/:reportId", checkUser, require("./reportPUT"));

module.exports = router;
