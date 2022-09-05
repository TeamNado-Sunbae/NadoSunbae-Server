const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /comment/:
 *   post:
 *     security:
 *       - jwt: []
 *     tags:
 *       - comment
 *     summary: 댓글 작성
 *     description: ''
 *     parameters: []
 *     responses:
 *       '201':
 *         description: 댓글 작성 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '403':
 *         description: 접근 권한 에러
 *       '404':
 *         description: 게시글 없음
 *       '500':
 *         description: 서버 내부 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               postId:
 *                 type: string
 *                 example: '14'
 *               content:
 *                 type: string
 *                 example: 댓글 내용입니다
 */
router.post("/", checkUser, require("./commentPOST"));

/**
 * @swagger
 * /comment/{commentId}:
 *   put:
 *     security:
 *       - jwt: []
 *     tags:
 *       - comment
 *     summary: 댓글 수정
 *     description: ''
 *     parameters:
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: '78'
 *     responses:
 *       '200':
 *         description: 댓글 수정 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '403':
 *         description: 접근 권한 에러
 *       '404':
 *         description: 해당 댓글 없음
 *       '500':
 *         description: 서버 내부 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: 수정할 댓글 내용입니다
 */
router.put("/:commentId", checkUser, require("./commentPUT"));

/**
 * @swagger
 * /comment/{commentId}:
 *   delete:
 *     security:
 *       - jwt: []
 *     tags:
 *       - comment
 *     summary: 댓글 삭제
 *     description: ''
 *     parameters:
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: '65'
 *     responses:
 *       '200':
 *         description: 댓글 삭제 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '500':
 *         description: 서버 내부 에러
 */
router.delete("/:commentId", checkUser, require("./commentDELETE"));

module.exports = router;
