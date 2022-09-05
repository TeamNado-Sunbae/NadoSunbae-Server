const express = require("express");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("../../config/swagger");

router.use("/auth", require("./auth"));
router.use("/user", require("./user"));
router.use("/review", require("./review"));
router.use("/post", require("./post"));
router.use("/major", require("./major"));
router.use("/comment", require("./comment"));
router.use("/like", require("./like"));
router.use("/report", require("./report"));
router.use("/notification", require("./notification"));
router.use("/block", require("./block"));
router.use("/inappropriate-review", require("./inappropriateReview"));
router.use("/app", require("./app"));

// swagger
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile, { explorer: true }));

module.exports = router;
