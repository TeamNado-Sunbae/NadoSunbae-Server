const dayjs = require("dayjs");
const timezone = require("dayjs/plugin/timezone");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
dayjs.extend(timezone);

// 현재 날짜를 미국 표준시로 반환
// return type: object(Date)
const getCurrentUTCDate = () => {
  const UTCNow = dayjs().utc();
  return UTCNow;
};

// 현재 날짜를 한국 표준시로 반환
// return type: object(Date)
const getCurrentKSTDate = () => {
  const KSTNow = dayjs().tz("Asia/Seoul");
  return KSTNow;
};

// month만큼 지난 후 만료되는 날짜를 반환
// input type: baseDate - object(Date), expirationMonth(number)
// return type: object(Date)
const getExpirationDateByMonth = (baseDate, expirationMonth) => {
  // set은 1 월에서 12 월까지의 월을 나타내는 0에서 11 사이의 정수를 받음
  const expirationDate = dayjs(baseDate).set(
    "month",
    dayjs(baseDate).get("month") + expirationMonth,
  );
  return expirationDate;
};

module.exports = {
  getCurrentUTCDate,
  getCurrentKSTDate,
  getExpirationDateByMonth,
};
