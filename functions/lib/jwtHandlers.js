const functions = require("firebase-functions");
const jwt = require("jsonwebtoken");
const { TOKEN_INVALID, TOKEN_EXPIRED } = require("../constants/jwt");

// set secretKey for JWT issue/verify
const secretKey = process.env.JWT_SECRET;

// id, email, name, firebaseId가 담긴 JWT를 발급
const access = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    nickname: user.nickname || null,
    firebaseId: user.firebaseId,
  };

  const result = {
    // accesstoken 발급
    accesstoken: jwt.sign(payload, secretKey, {
      algorithm: "HS256",
      expiresIn: "1m",
      issuer: "nadoSunbae",
    }),
  };
  return result;
};

const refresh = () => {
  // refreshtoken 발급, payload 없음
  const result = {
    refreshtoken: jwt.sign({}, secretKey, {
      algorithm: "HS256",
      expiresIn: "14d",
      issuer: "nadoSunbae",
    }),
  };
  return result;
};

// 해독 및 해독한 JWT 인증
const verify = (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (err) {
    if (err.message === "jwt expired") {
      console.log("expired token");
      functions.logger.error("expired token");
      return TOKEN_EXPIRED;
    } else if (err.message === "invalid token") {
      console.log("invalid token");
      functions.logger.error("invalid token");
      return TOKEN_INVALID;
    } else {
      console.log("invalid token");
      functions.logger.error("invalid token");
      return TOKEN_INVALID;
    }
  }
  return decoded;
};

module.exports = {
  access,
  refresh,
  verify,
};
