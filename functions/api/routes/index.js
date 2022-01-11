const express = require("express");
const router = express.Router();

// router.use('/auth', require('./auth'));
router.use("/major", require("./major"));

module.exports = router;
