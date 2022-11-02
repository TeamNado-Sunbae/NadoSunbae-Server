var swaggerJsdoc = require("swagger-jsdoc");
const dotenv = require("dotenv");
dotenv.config();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Nadosunbae server API",
      version: "2.0.0",
      description: "나도선배 develop용 API 명세서입니다.",
    },
    servers: [
      {
        url: process.env.DEV_URL,
        description: "develop url",
      },
      {
        url: process.env.LOCAL_URL,
        description: "local url",
      },
    ],
    components: {
      securitySchemes: {
        jwt: {
          type: "apiKey",
          name: "accesstoken",
          in: "header",
        },
      },
    },
  },
  apis: [__dirname + "/../api/routes/*/index.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
