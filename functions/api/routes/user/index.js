const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /user/major/{majorId}:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - user
 *     summary: 과방 선배 조회 (쿼리 있음)
 *     description: exclude -> noReview / res에 질문 가능 선배, 질문 불가 선배 나눠져있습니다.
 *     parameters:
 *       - name: majorId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: '5'
 *       - name: exclude
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 선배 리스트 조회 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/major/:majorId", checkUser, require("./userListMajorGET"));

/**
 * @swagger
 * /user/post:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - user
 *     summary: 마이페이지 내가 쓴 글 조회 (쿼리 있음)
 *     description: 'filter -> 1:1 질문: questionToPerson, 커뮤니티: community'
 *     parameters:
 *       - name: filter
 *         in: query
 *         schema:
 *           type: string
 *         example: community
 *     responses:
 *       '200':
 *         description: 내가 쓴 글 조회 성공
 *       '400':
 *         description: 필요한 값 누락, 필터 에러
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/post", checkUser, require("./userMypagePostListGET"));

/**
 * @swagger
 * /user/comment:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - user
 *     summary: 마이페이지 내가 쓴 답글 조회 (쿼리 있음)
 *     description: 'filter -> 1:1 질문: questionToPerson, 커뮤니티: community'
 *     parameters:
 *       - name: filter
 *         in: query
 *         schema:
 *           type: string
 *         example: questionToPerson
 *     responses:
 *       '200':
 *         description: 내가 쓴 답글 조회 성공
 *       '400':
 *         description: 필요한 값 누락, 필터 에러
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/comment", checkUser, require("./userMypageCommentListGET"));

/**
 * @swagger
 * /user/like:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - user
 *     summary: 마이페이지 좋아요 목록 조회 (쿼리 있음)
 *     description: 'filter -> 후기: review, 1:1 질문: questionToPerson, 커뮤니티: community'
 *     parameters:
 *       - name: filter
 *         in: query
 *         schema:
 *           type: string
 *         example: review
 *     responses:
 *       '200':
 *         description: 내가 좋아요 누른 글 조회 성공
 *       '400':
 *         description: 필요한 값 누락, 타입 에러
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/like", checkUser, require("./userMypageLikeListGET"));

/**
 * @swagger
 * /user/{userId}/review:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - user
 *     summary: 마이페이지 내가 쓴 후기 조회
 *     description: ''
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: '3'
 *     responses:
 *       '200':
 *         description: 내가 쓴 후기 조회 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/:userId/review", checkUser, require("./userMypageReviewListGET"));

/**
 * @swagger
 * /user/{userId}/post/question:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - user
 *     summary: 마이페이지 1:1 질문 조회 (쿼리 있음)
 *     description: 'sort -> 최신순: recent, 좋아요 순: like'
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: '109'
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *         example: like
 *     responses:
 *       '200':
 *         description: 나에게 온 1:1 질문 조회 성공
 *       '400':
 *         description: 필요한 값 누락, 필터 에러
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/:userId/post/question", checkUser, require("./userMypagePostQuestionListGET"));

/**
 * @swagger
 * /user/{userId}:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - user
 *     summary: 해당 유저 마이페이지 조회
 *     description: 나의 마이페이지인 경우, count는 좋아요 갯수 / 남의 마이페이지인 경우 count는 후기 갯수
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: '109'
 *     responses:
 *       '200':
 *         description: 해당 유저 마이페이지 조회 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '404':
 *         description: 해당 유저 없음
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/:userId", checkUser, require("./userMypageGET"));

/**
 * @swagger
 * /user/:
 *   put:
 *     security:
 *       - jwt: []
 *     tags:
 *       - user
 *     summary: 마이페이지 수정
 *     description: ''
 *     parameters: []
 *     responses:
 *       '200':
 *         description: 마이페이지 수정 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '409':
 *         description: 이미 사용 중인 닉네임
 *       '500':
 *         description: 서버 내부 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileImageId:
 *                 type: string
 *                 example: '3'
 *               nickname:
 *                 type: string
 *                 example: jh
 *               bio:
 *                 type: string
 *                 example: 한 줄 소개
 *               isOnQuestion:
 *                 type: boolean
 *                 example: true
 *               firstMajorId:
 *                 type: string
 *                 example: '4'
 *               firstMajorStart:
 *                 type: string
 *                 example: 19-1
 *               secondMajorId:
 *                 type: string
 *                 example: '30'
 *               secondMajorStart:
 *                 type: string
 *                 example: 21-1
 */
router.put("/", checkUser, require("./userMypagePUT"));

module.exports = router;
