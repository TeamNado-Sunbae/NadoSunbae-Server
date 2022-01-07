const admin = require("firebase-admin");
const serviceAccount = require("./nadosunbae-server-firebase-adminsdk-lzgu9-7c653db78a");
const dotenv = require("dotenv");

dotenv.config();

let firebase;
if (admin.apps.length === 0) {
  firebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  firebase = admin.app();
}

module.exports = {
  api: require("./api"),
};
