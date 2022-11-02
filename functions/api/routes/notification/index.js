const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

/**
 * @swagger
 * /notification/:
 *   get:
 *     security:
 *       - jwt: []
 *     tags:
 *       - notification
 *     summary: 알림 리스트 조회
 *     description: ''
 *     responses:
 *       '200':
 *         description: 알림 리스트 조회 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '403':
 *         description: 접근 권한 에러
 *       '500':
 *         description: 서버 내부 에러
 */
router.get("/", checkUser, require("./notificationListGET.js"));

/**
 * @swagger
 * /notification/{notificationId}/read:
 *   put:
 *     security:
 *       - jwt: []
 *     tags:
 *       - notification
 *     summary: 알림 읽음 처리
 *     description: ''
 *     parameters:
 *       - name: notificationId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *         example: 23
 *     responses:
 *       '200':
 *         description: 알림 읽음 업데이트 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '404':
 *         description: 해당 알림 없음
 *       '500':
 *         description: 서버 내부 에러
 */
router.put("/:notificationId/read", checkUser, require("./notificationReadPUT.js"));

/**
 * @swagger
 * /notification/{notificationId}:
 *   delete:
 *     security:
 *       - jwt: []
 *     tags:
 *       - notification
 *     summary: 알림 삭제
 *     description: ''
 *     parameters:
 *       - name: notificationId
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *         example: 5
 *     responses:
 *       '200':
 *         description: 알림 삭제 성공
 *       '400':
 *         description: 필요한 값 누락
 *       '500':
 *         description: 서버 내부 에러
 */
router.delete("/:notificationId", checkUser, require("./notificationDELETE.js"));

module.exports = router;
