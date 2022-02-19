// 현재 날짜를 미국 표준시로 반환
// return type: number
const getCurrentUTCNumberDate = () => {
  const today = new Date();
  const UTCNow = today.getTime() + today.getTimezoneOffset() * 60 * 1000;
  return UTCNow;
};

// 현재 날짜를 미국 표준시로 반환
// return type: object(Date)
const getCurrentUTCDate = () => {
  const UTCNow = new Date(getCurrentUTCNumberDate());
  return UTCNow;
};

// 현재 날짜를 한국 표준시로 반환
// return type: object(Date)
const getCurrentKSTDate = () => {
  const UTCNow = getCurrentUTCNumberDate();

  const KST_TIME_DIFF = 9 * 60 * 60 * 1000; // UTC보다 9시간 빠름
  const KSTNow = new Date(UTCNow + KST_TIME_DIFF);
  return KSTNow;
};

// month만큼 지난 후 만료되는 날짜를 반환
// input type: baseDate - object(Date), expirationMonth(number)
// return type: object(Date)
const getExpirationDateByMonth = (baseDate, expirationMonth) => {
  // setMonth parameter는 1 월에서 12 월까지의 월을 나타내는 0에서 11 사이의 정수
  const expirationDate = new Date(baseDate.setMonth(baseDate.getMonth() + expirationMonth));
  return expirationDate;
};

module.exports = {
  getCurrentUTCNumberDate,
  getCurrentUTCDate,
  getCurrentKSTDate,
  getExpirationDateByMonth,
};
