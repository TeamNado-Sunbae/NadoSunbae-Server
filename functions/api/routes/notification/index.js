const express = require("express");
const { checkUser } = require("../../../middlewares/auth");
const router = express.Router();

router.get("/:receiverId", checkUser, require("./notificationListGET.js"));
router.put("/:notificationId/read", checkUser, require("./notificationReadPUT.js"));
router.delete("/:notificationId", checkUser, require("./notificationDELETE.js"));

module.exports = router;
