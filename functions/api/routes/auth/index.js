const express = require("express");
const router = express.Router();

router.post(
  "/duplication-check/nickname",
  require("./authDuplicationCheckNicknamePOST"),
);

module.exports = router;
