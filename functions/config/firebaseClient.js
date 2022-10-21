const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const dotenv = require("dotenv");

dotenv.config();

const prodFirebaseConfig = {
  apiKey: process.env.PROD_API_KEY,
  authDomain: process.env.PROD_AUTH_DOMAIN,
  projectId: process.env.PROD_PROJECT_ID,
  storageBucket: process.env.PROD_STORAGE_BUCKET,
  messagingSenderId: process.env.PROD_MESSAGING_SENDER_ID,
  appId: process.env.PROD_APP_ID,
  measurementId: process.env.PROD_MEASUREMENT_ID,
};

const devFirebaseConfig = {
  apiKey: process.env.DEV_API_KEY,
  authDomain: process.env.DEV_AUTH_DOMAIN,
  projectId: process.env.DEV_PROJECT_ID,
  storageBucket: process.env.DEV_STORAGE_BUCKET,
  messagingSenderId: process.env.DEV_MESSAGING_SENDER_ID,
  appId: process.env.DEV_APP_ID,
  measurementId: process.env.DEV_MEASUREMENT_ID,
};

const firebaseConfig =
  process.env.NODE_ENV === "production" ? prodFirebaseConfig : devFirebaseConfig;

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);

module.exports = { firebaseApp, firebaseAuth, firebaseConfig };
