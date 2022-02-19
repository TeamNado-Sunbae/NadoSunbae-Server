// 현재 날짜를 미국 표준시로 반환
// return type: number
const getCurrentUTCNumberDate = () => {
  const today = new Date();
  const UTCNow = today.getTime() + today.getTimezoneOffset() * 60 * 1000;
  return UTCNow;
};

// 현재 날짜를 미국 표준시로 반환
// return type: object (Date)
const getCurrentUTCDate = () => {
  const UTCNow = new Date(getCurrentUTCNumberDate());
  return UTCNow;
};

// 현재 날짜를 한국 표준시로 반환
// return type: object (Date)
const getCurrentKSTDate = () => {
  const UTCNow = getCurrentUTCNumberDate();

  const KST_TIME_DIFF = 9 * 60 * 60 * 1000; // UTC보다 9시간 빠름
  const KSTNow = new Date(UTCNow + KST_TIME_DIFF);
  return KSTNow;
};

module.exports = {
  getCurrentUTCNumberDate,
  getCurrentUTCDate,
  getCurrentKSTDate,
};
