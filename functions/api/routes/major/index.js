const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/list/:universityId", require("./majorListGET"));

module.exports = router;
