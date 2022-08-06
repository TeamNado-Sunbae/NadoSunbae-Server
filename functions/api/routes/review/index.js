const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.post("/", checkUser, require("./reviewPOST"));
router.delete("/:id", checkUser, require("./reviewDELETE"));
router.get("/:id", checkUser, require("./reviewDetailGET"));
router.get("/tag", checkUser, require("./reviewTagListGET"));
router.put("/:id", checkUser, require("./reviewPUT"));

// 모든 학과 리뷰 최신순 조회
router.get("/university/:universityId", checkUser, require("./reviewGET"));

// 특정 학과 리뷰 조회
router.post("/", checkUser, require("./reviewListPOST"));

module.exports = router;
