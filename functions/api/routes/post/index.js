const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /post/:
 *   post:
 *     security:
 *       - jwt: []
 *     tags:
 *       - post
 *     summary: 게시글 작성
 *     description: 'type -> 자유: general, 정보: information, 1:1 질문: questionToPerson, 전체 질문: questionToEveryone'
 *     parameters: []
 *     responses:
 *       '201':
 *         description: 커뮤니티 글 작성 성공
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
 *               type:
 *                 type: string
 *                 example: general
 *               majorId:
 *                 type: number
 *                 example: 14
 *               answererId:
 *                 type: number
 *                 example: 32
 *               title:
 *                 type: string
 *                 example: 제목입니다
 *               content:
 *                 type: string
 *                 example: 내용입니다
 */
router.post("/", checkUser, require("./postPOST"));

/**
 * @swagger
 * /post/{postId}:
 *   delete:
 *     security:
 *       - jwt: []
 *     tags:
 *       - post
 *     summary: 게시글 삭제
 *     description: ''
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *         example: 38
 *     responses:
 *       '200':
 *         description: 커뮤니티 글 삭제 성공
 *       '400':
 *         description: 필요한 값 누락, 필터 에러
 *       '403':
 *         description: 접근 권한 에러
 *       '404':
 *         description: 게시글 없음, 댓글 삭제 에러
 *       '500':
 *         description: 서버 내부 에러
 */
router.delete("/:postId", checkUser, require("./postDELETE"));

/**
 * @swagger
 * /post/{postId}:
 *   put:
 *     security:
 *       - jwt: []
 *     tags:
 *       - post
 *     summary: 게시글 수정
 *     description: ''
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *         example: 49
 *     responses:
 *       '200':
 *         description: 커뮤니티 글 수정 성공
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
 *               title:
 *                 type: string
 *                 example: 제목입니다
 *               content:
 *                 type: string
 *                 example:
 */
router.put("/:postId", checkUser, require("./postPUT"));

/**
 * @swagger
 * /post/{postId}:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - post
 *     summary: 게시글 상세 조회
 *     description: ''
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *         example: 25
 *     responses:
 *       '200':
 *         description: 커뮤니티 글 상세 조회 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '404':
 *         description: 게시글 없음
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/:postId", checkUser, require("./postGET"));

/**
 * @swagger
 * /post/university/{universityId}:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - post
 *     summary: 게시글 조회 (쿼리 있음)
 *     description: 'filter -> 커뮤니티: community, 자유: general, 정보: information, 1:1 질문: questionToPerson, 전체에게 질문: questionToEveryone / sort -> 최신순: recent, 좋아요순: like / majorId -> 필수가 아님 안 넣으면 전체 조회'
 *     parameters:
 *       - name: universityId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *         example: 1
 *       - name: majorId
 *         in: query
 *         schema:
 *           type: number
 *         example: 5
 *       - name: filter
 *         in: query
 *         schema:
 *           type: string
 *         example: community
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *         example: like
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         example: 이러지마
 *     responses:
 *       '200':
 *         description: 커뮤니티 글 조회 성공
 *       '400':
 *         description: 필요한 값 누락, 필터 에러
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/university/:universityId", checkUser, require("./postUniversityListGET"));

module.exports = router;
