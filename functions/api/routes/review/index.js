const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /review/:
 *   post:
 *     security:
 *       - jwt: []
 *     tags:
 *       - review
 *     summary: 후기 등록
 *     description: ''
 *     parameters: []
 *     responses:
 *       '201':
 *         description: 후기 등록 성공
 *       '400':
 *         description: 필요한 값 누락, id 범위 에러
 *       '500':
 *         description: 서버 내부 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               majorId:
 *                 type: string
 *                 example: '3'
 *               backgroundImageId:
 *                 type: string
 *                 example: '9'
 *               oneLineReview:
 *                 type: string
 *                 example: 한 줄 후기
 *               prosCons:
 *                 type: string
 *                 example: 장단점
 *               curriculum:
 *                 type: string
 *                 example: 커리큘럼
 *               recommendLecture:
 *                 type: string
 *                 example: 추천 수업
 *               nonRecommendLecture:
 *                 type: string
 *                 example: 비추 수업
 *               career:
 *                 type: string
 *                 example: 진로
 *               tip:
 *                 type: string
 *                 example: 꿀팁
 */
router.post("/", checkUser, require("./reviewPOST"));

/**
 * @swagger
 * /review/{id}:
 *   delete:
 *     security:
 *       - jwt: []
 *     tags:
 *       - review
 *     summary: 후기 삭제
 *     description: 본인 후기만 삭제 가능
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: '46'
 *     responses:
 *       '200':
 *         description: 후기 삭제 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '403':
 *         description: 접근 권한 에러
 *       '404':
 *         description: 해당 후기글 없음, 후기글 태그 삭제 에러, 유저 에러
 *       '500':
 *         description: 서버 내부 에러
 */
router.delete("/:id", checkUser, require("./reviewDELETE"));

/**
 * @swagger
 * /review/tag:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - review
 *     summary: 후기 태그 리스트 조회
 *     description: ''
 *     parameters: []
 *     responses:
 *       '200':
 *         description: 후기 태그 리스트 조회 성공
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/tag", checkUser, require("./reviewTagListGET"));

/**
 * @swagger
 * /review/{id}:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - review
 *     summary: 후기 상세 조회
 *     description: ''
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: '45'
 *     responses:
 *       '200':
 *         description: 후기 상세 조회 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '404':
 *         description: 해당 후기글 없음
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/:id", checkUser, require("./reviewDetailGET"));

/**
 * @swagger
 * /review/major/{majorId}:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - review
 *     summary: 해당 전공 후기 조회 (쿼리 있음)
 *     description: 'sort -> 최신순: recent, 좋아요 순: like / writerFilter -> 전체: all, 제 1전공: firstMajor, 제 2전공: secondMajor / tagFilter -> 1, 2, 3, 4, 5 (tagFilter=3, tagFilter=4 와 같이 여러개 넣어주시면 됩니다.)'
 *     parameters:
 *       - name: majorId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: '5'
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *           example: recent
 *       - name: tagFilter
 *         in: query
 *         schema:
 *           type: string
 *           example: '2'
 *       - name: writerFilter
 *         in: query
 *         schema:
 *           type: string
 *           example: all
 *     responses:
 *       '200':
 *         description: 학과 리뷰 조회 성공
 *       '400':
 *         description: 필요한 값 누락, 필터 에러
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/major/:majorId", checkUser, require("./reviewMajorListGET"));

/**
 * @swagger
 * /review/{id}:
 *   put:
 *     security:
 *       - jwt: []
 *     tags:
 *       - review
 *     summary: 후기 수정
 *     description: 본인 후기만 수정 가능
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: '46'
 *     responses:
 *       '200':
 *         description: 후기 수정 성공
 *       '400':
 *         description: 필요한 값 누락, id 범위 에러
 *       '403':
 *         description: 접근 권한 에러
 *       '404':
 *         description: 해당 후기글 없음, 후기글 태그 삭제 에러, 유저 에러
 *       '500':
 *         description: 서버 내부 에러
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               backgroundImageId:
 *                 type: string
 *                 example: '6'
 *               oneLineReview:
 *                 type: string
 *                 example: 한 줄 후기
 *               prosCons:
 *                 type: string
 *                 example: 장단점
 *               curriculum:
 *                 type: string
 *                 example: 커리큘럼
 *               recommendLecture:
 *                 type: string
 *                 example: 추천 수업
 *               nonRecommendLecture:
 *                 type: string
 *                 example: 비추 추업
 *               career:
 *                 type: string
 *                 example: 진로
 *               tip:
 *                 type: string
 *                 example: 꿀팁ㅁㅁ
 */
router.put("/:id", checkUser, require("./reviewPUT"));

/**
 * @swagger
 * /review/university/{universityId}:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - review
 *     summary: 학교 후기 전체 최신순 조회
 *     description: ''
 *     parameters:
 *       - name: universityId
 *         in: path
 *         required: true
 *         schema:
 *          type: string
 *         example: '1'
 *     responses:
 *       '200':
 *         description: 학교 리뷰 조회 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/university/:universityId", checkUser, require("./reviewUniversityListGET"));

module.exports = router;
