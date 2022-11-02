module.exports = {
  // query or params 값 오류
  NULL_VALUE: "필요한 값이 없습니다.",
  OUT_OF_VALUE: "요청한 값이 잘못되었습니다.",
  INCORRECT_TYPE: "타입값이 잘못되었습니다.",
  INCORRECT_FILTER: "필터값이 잘못되었습니다.",
  INCORRECT_SORT: "정렬값이 잘못되었습니다.",

  // 대학
  NO_EMAIL: "이메일 값이 없습니다.",
  READ_SUNBAE_RANK: "선배 랭킹 조회 성공",

  // 서버 내 오류
  INTERNAL_SERVER_ERROR: "서버 내 오류",

  // 회원가입 및 탈퇴
  CREATE_USER: "회원 가입 성공",
  DELETE_USER: "회원 탈퇴 성공",
  DELETE_USER_FAIL: "회원 탈퇴 실패",
  READ_UNIVERSITY_EMAIL_SUCCESS: "해당 학교 이메일 주소 조회 성공",

  // 로그인 및 로그아웃
  LOGIN_SUCCESS: "로그인 성공",
  LOGOUT_SUCCESS: "로그아웃 성공",
  MISS_MATCH_PW: "비밀번호가 맞지 않습니다.",
  INVALID_EMAIL: "이메일 형식을 확인해주세요.",

  // 유저
  READ_ONE_USER_SUCCESS: "유저 조회 성공",
  READ_ALL_USERS_SUCCESS: "모든 유저 조회 성공",
  UPDATE_ONE_USER_SUCCESS: "유저 수정 성공",
  NO_USER: "존재하지 않는 회원입니다.",
  NO_USER_EMAIL: "해당 메일로 가입된 사용자가 없습니다.",
  ALREADY_EMAIL: "이미 사용중인 이메일입니다.",
  ALREADY_NICKNAME: "이미 사용중인 닉네임입니다.",
  AVAILABLE_MAIL: "사용 가능한 이메일입니다.",
  AVAILABLE_NICKNAME: "사용 가능한 닉네임입니다.",

  // 게시글
  CREATE_ONE_POST_SUCCESS: "게시글 추가 성공",
  READ_ONE_POST_SUCCESS: "게시글 조회 성공",
  READ_ALL_POSTS_SUCCESS: "모든 게시글 조회 성공",
  UPDATE_ONE_POST_SUCCESS: "게시글 수정 성공",
  DELETE_ONE_POST_SUCCESS: "게시글 삭제 성공",
  NO_POST: "존재하지 않는 게시글입니다.",
  NO_POST_TAG_RELATION: "존재하지 않는 릴레이션입니다.",
  INCORRECT_POST_TYPE_ID: "올바르지 않은 게시글 타입 아이디입니다.",

  // 답글
  CREATE_ONE_COMMENT_SUCCESS: "답글 추가 성공",
  UPDATE_ONE_COMMENT_SUCCESS: "답글 수정 성공",
  DELETE_ONE_COMMENT_SUCCESS: "답글 삭제 성공",
  NO_COMMENT: "존재하지 않는 답글입니다.",

  // 태그
  READ_ALL_TAGS_SUCCESS: "후기 내용 태그 리스트 조회 성공",

  // 토큰
  TOKEN_EXPIRED: "토큰이 만료되었습니다.",
  TOKEN_INVALID: "토큰이 유효하지 않습니다.",
  TOKEN_EMPTY: "토큰이 없습니다.",
  UPDATE_DEVICE_TOKEN_FAIL: "디바이스 토큰 업데이트 실패",
  UPDATE_REFRESH_TOKEN_FAIL: "리프레시 토큰 업데이트 실패",
  UPDATE_TOKEN_SUCCESS: "토큰 재발급 성공",

  // 인증
  FORBIDDEN_ACCESS: "사용 권한이 없습니다.",
  IS_NOT_EMAIL_VERIFICATION: "이메일 인증이 되지 않은 유저입니다.",

  // 메일 전송
  SEND_VERIFICATION_EMAIL_SUCCESS: "인증 메일 보내기 성공",
  SEND_VERIFICATION_EMAIL_FAIL: "인증 메일 보내기 실패",
  SEND_RESET_PASSWORD_EMAIL_SUCCESS: "비밀번호 재설정 메일 보내기 성공",
  SEND_RESET_PASSWORD_EMAIL_FAIL: "비밀번호 재설정 메일 보내기 실패",

  // 전공
  READ_ONE_MAJOR_SUCCESS: "해당 학과 정보 가져오기 성공",
  READ_ALL_MAJORS_SUCCESS: "해당 학교의 학과 목록 조회 성공",
  NO_MAJOR: "존재하지 않는 전공입니다.",

  // 좋아요
  UPDATE_LIKE_SUCCESS: "게시글 좋아요 업데이트 성공",

  // 신고 및 부적절 후기
  REPORT_SUCCESS: "신고 성공",
  IS_REPORTED_SUCCESS: "신고 접수 성공",
  ALREADY_REPORT: "이미 신고한 글/답글입니다.",
  NO_REPORT_TARGET: "존재하지 않는 글/답글입니다.",
  NO_REPORT: "존재하지 않는(혹은 만료된) 신고입니다.",
  CREATE_ONE_INAPPROPRIATE_REVIEW_SUCCESS: "부적절 후기 등록 성공",

  // 차단
  BLOCK_SUCCESS: "차단 업데이트 성공",
  READ_ALL_BLOCKED_USERS_SUCCESS: "차단 목록 조회 성공",

  // 알림
  PUSH_ALARM_SEND_SUCCESS: "푸시 알림 전송 성공",
  PUSH_ALARM_SEND_FAIL: "푸시 알림 전송 실패",
  READ_ONE_NOTIFICATION_SUCCESS: "알림 읽기 성공",
  READ_ALL_NOTIFICATIONS_SUCCESS: "모든 알림 조회 성공",
  DELETE_ONE_NOTIFICATION_SUCCESS: "알림 삭제 성공",
  NO_NOTIFICATION: "존재하지 않는 알림입니다.",

  // 앱 정보
  READ_APP_VERSION: "최신 앱 버전 조회 성공",
  READ_APP_LINK: "앱 링크 조회 성공",
  READ_APP_BANNER: "앱 배너 조회 성공",

  // 즐겨찾기
  INCORRECT_MAJOR: "학과가 잘못되었습니다.",
  UPDATE_FAVORITES_SUCCESS: "즐겨찾기 업데이트 성공",
};
