const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");

const prodFirebaseConfig = {
  apiKey: "AIzaSyBEqiqaiIR7czG5XLBgxgbFERioHa6kGJ0",
  authDomain: "nadosunbae-server.firebaseapp.com",
  projectId: "nadosunbae-server",
  storageBucket: "nadosunbae-server.appspot.com",
  messagingSenderId: "473721519726",
  appId: "1:473721519726:web:9c1a172885f4c6e479307f",
  measurementId: "G-QG47JRQXY7",
};

const devFirebaseConfig = {
  apiKey: "AIzaSyA1bFdLq0jfVfBhb3EihIgw5WJ-KIeNVwI",
  authDomain: "nadosunbae-server-dev-90ac3.firebaseapp.com",
  projectId: "nadosunbae-server-dev-90ac3",
  storageBucket: "nadosunbae-server-dev-90ac3.appspot.com",
  messagingSenderId: "978556585705",
  appId: "1:978556585705:web:7539681d09460699db9278",
  measurementId: "G-YL3225MTLE",
};

const firebaseConfig =
  process.env.NODE_ENV === "production" ? prodFirebaseConfig : devFirebaseConfig;

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);

module.exports = { firebaseApp, firebaseAuth, firebaseConfig };
