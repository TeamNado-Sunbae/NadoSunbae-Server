const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /app/link:
 *   get:
 *     summary: 앱 링크 조회
 *     tags: [app]
 *     responses:
 *       200:
 *         description: 앱 링크 조회 성공
 *       500:
 *         description: 서버 내부 에러
 */
router.get("/link", require("./appLinkGET"));

/**
 * @swagger
 * /app/banner:
 *   get:
 *     summary: 앱 배너 리스트 조회
 *     tags: [app]
 *     responses:
 *       200:
 *         description: 앱 배너 리스트 조회 성공
 *       500:
 *         description: 서버 내부 에러
 */
router.get("/banner", require("./bannerListGET"));

/**
 * @swagger
 * /app/version/recent:
 *   get:
 *     summary: 앱 최신 버전 조회
 *     tags: [app]
 *     responses:
 *       200:
 *         description: 앱 최신 버전 조회 성공
 *       500:
 *         description: 서버 내부 에러
 */
router.get("/version/recent", require("./versionRecentGET"));

module.exports = router;
