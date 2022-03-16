const admin = require("firebase-admin");
const prodServiceAccount = require("./nadosunbae-server-firebase-adminsdk-lzgu9-7c653db78a");
const devServiceAccount = require("./nadosunbae-server-dev-90ac3-firebase-adminsdk-r7b4s-10d004f02b");
const dotenv = require("dotenv");

dotenv.config();

const serviceAccount =
  process.env.NODE_ENV === "production" ? prodServiceAccount : devServiceAccount;

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
