const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/list/major/:majorId", checkUser, require("./userListMajorGET"));

module.exports = router;
