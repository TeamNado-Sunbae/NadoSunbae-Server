const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });

var swaggerDefinition = {
  info: {
    title: "Nadosunbae server API",
    version: "1.0.0",
    description: "나도선배 develop용 API 명세서입니다.",
  },
  securityDefinitions: {
    jwt: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
    },
  },
  security: [{ jwt: [] }],
};

const outputFile = __dirname + "/new-swagger-output.json";
const endpointsFiles = [__dirname + "/../../api/routes/index.js"];

swaggerAutogen(outputFile, endpointsFiles, swaggerDefinition);
