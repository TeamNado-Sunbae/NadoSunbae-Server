const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyBEqiqaiIR7czG5XLBgxgbFERioHa6kGJ0",
  authDomain: "nadosunbae-server.firebaseapp.com",
  projectId: "nadosunbae-server",
  storageBucket: "nadosunbae-server.appspot.com",
  messagingSenderId: "473721519726",
  appId: "1:473721519726:web:9c1a172885f4c6e479307f",
  measurementId: "G-QG47JRQXY7",
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);

module.exports = { firebaseApp, firebaseAuth, firebaseConfig };
