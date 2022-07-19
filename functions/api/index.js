const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const hpp = require("hpp");
const helmet = require("helmet");

// use .env for security
dotenv.config();

// initializing
const app = express();

// Cross-Origin Resource Sharing
// for more info, visit https://evan-moon.github.io/2020/05/21/about-cors/
app.use(cors());

//  middlewares for security
//  NODE_ENV: 배포된 서버(production, development), 로컬 서버(local)
if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development") {
  app.use(hpp());
  app.use(helmet());
}

// parse requests to json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routing with routes directory
app.use("/", require("./routes"));

// path not found
app.use("*", (req, res) => {
  res.status(404).json({
    status: 404,
    success: false,
    message: "잘못된 경로입니다.",
  });
});

// for firebase functions
module.exports = functions
  .runWith({
    timeoutSeconds: 300, // 300 sec for processing request
    memory: "512MB",
  })
  .region("asia-northeast3") // seoul
  .https.onRequest(async (req, res) => {
    // for debugging
    console.log(
      "\n\n",
      "[api]",
      `[${req.method.toUpperCase()}]`,
      req.originalUrl,
      `[${req.method}] ${!!req.user ? `${req.user.id}` : ``} ${req.originalUrl}\n ${
        !!req.query && `query: ${JSON.stringify(req.query)}`
      } ${!!req.params && `params ${JSON.stringify(req.params)}`}`,
    );

    return app(req, res);
  });
