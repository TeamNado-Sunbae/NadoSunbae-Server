const functions = require("firebase-functions");
const util = require("../../../lib/util");
const statusCode = require("../../../constants/statusCode");
const responseMessage = require("../../../constants/responseMessage");
const db = require("../../../db/db");
const { tagDB } = require("../../../db");

module.exports = async (req, res) => {
  let client;

  // 에러 트래킹을 위해 try / catch문을 사용합니다.
  // try문 안에서 우리의 로직을 실행합니다.
  try {
    // db/db.js에 정의한 connect 함수를 통해 connection pool에서 connection을 빌려옵니다.
    client = await db.connect(req);

    // 빌려온 connection을 사용해 우리가 db/[파일].js에서 미리 정의한 SQL 쿼리문을 날려줍니다.
    let tagList = await tagDB.getTagList(client);

    const data = { tagList: tagList };

    // 성공적으로 users를 가져왔다면, response를 보내줍니다.
    res
      .status(statusCode.OK)
      .send(util.success(statusCode.OK, responseMessage.READ_ALL_TAGS_SUCCESS, data));

    // try문 안에서 에러가 발생했을 시 catch문으로 error객체가 넘어옵니다.
    // 이 error 객체를 콘솔에 찍어서 어디에 문제가 있는지 알아냅니다.
    // 이 때 단순히 console.log만 해주는 것이 아니라, Firebase 콘솔에서도 에러를 모아볼 수 있게 functions.logger.error도 함께 찍어줍니다.
  } catch (error) {
    functions.logger.error(
      `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`,
      `[CONTENT] ${error}`,
    );
    console.log(error);

    // 그리고 역시 response 객체를 보내줍니다.
    res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));

    // finally문은 try문이 끝나든 catch문이 끝나든 반드시 실행되는 블록입니다.
    // 여기서는 db.connect(req)를 통해 빌려온 connection을 connection pool에 되돌려줍니다.
    // connection을 되돌려주는 작업은 반드시 이루어져야 합니다.
    // 그렇지 않으면 요청의 양이 일정 수준을 넘어갈 경우 쌓이기만 하고 해결되지 않는 문제가 발생합니다.
  } finally {
    client.release();
  }
};
