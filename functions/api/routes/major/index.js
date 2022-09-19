const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /major/university/{universityId}:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - major
 *     summary: 학과 리스트 조회
 *     description: 'filter -> 전체: all, 제 1전공: firstMajor, 제 2전공: secondMajor / exclude -> 학과 무관: noMajor'
 *     parameters:
 *       - name: universityId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *         example: 1
 *       - name: filter
 *         in: query
 *         schema:
 *           type: string
 *         example: all
 *       - name: exclude
 *         in: query
 *         schema:
 *           type: string
 *         example: noMajor
 *     responses:
 *       '200':
 *         description: 해당 학교 학과 리스트 조회 성공
 *       '400':
 *         description: 필요한 값 누락, 필터 에러
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/university/:universityId", require("./majorUniversityListGET"));

/**
 * @swagger
 * /major/{majorId}:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - major
 *     summary: 학과 상세 조회
 *     description: ''
 *     parameters:
 *       - name: majorId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *         example: 2
 *     responses:
 *       '200':
 *         description: 학과 상세 조회 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '404':
 *         description: 해당 학과 없음
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/:majorId", checkUser, require("./majorGET"));

module.exports = router;
