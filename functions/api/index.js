const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const hpp = require("hpp");
const helmet = require("helmet");
const util = require("../lib/util");
const admin = require("firebase-admin");
const prodServiceAccount = require("../nadosunbae-server-firebase-adminsdk-lzgu9-7c653db78a");
const devServiceAccount = require("../nadosunbae-server-dev-90ac3-firebase-adminsdk-r7b4s-10d004f02b");
const logger = require("morgan");

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
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// req logging
const reqLogger = (req, res, next) => {
  console.log(
    "\n\n",
    "[api]",
    `[${req.method.toUpperCase()}]`,
    req.originalUrl,
    `[${req.method}] ${!!req.user ? `${req.user.id}` : ``} ${req.originalUrl}\n ${
      !!req.query && `query: ${JSON.stringify(req.query)}`
    } ${!!req.params && `params ${JSON.stringify(req.params)}`}`,
  );

  next();
};

// routing with routes directory
app.use("/api", reqLogger, require("./routes"));

// path not found
app.use("*", (req, res) => {
  res.status(404).send(util.fail(404, "잘못된 경로입니다."));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const serviceAccount =
  process.env.NODE_ENV === "production" ? prodServiceAccount : devServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = app;
