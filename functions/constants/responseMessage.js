module.exports = {
  NULL_VALUE: "필요한 값이 없습니다",
  OUT_OF_VALUE: "요청한 값이 잘못되었습니다",
  NO_RELATION: "존재하지 않는 릴레이션입니다.",

  // 회원가입
  CREATE_USER: "회원 가입 성공",
  DELETE_USER: "회원 탈퇴 성공",
  ALREADY_EMAIL: "이미 사용중인 이메일입니다.",
  AVAILABLE_MAIL: "사용 가능한 이메일입니다.",
  ALREADY_NICKNAME: "이미 사용중인 닉네임입니다.",
  AVAILABLE_NICKNAME: "사용 가능한 닉네임입니다.",

  // 로그인
  LOGIN_SUCCESS: "로그인 성공",
  LOGIN_FAIL: "로그인 실패",
  NO_USER: "존재하지 않는 회원입니다.",
  MISS_MATCH_PW: "비밀번호가 맞지 않습니다.",
  INVALID_EMAIL: "이메일 형식을 확인해주세요.",

  // 프로필 조회
  READ_PROFILE_SUCCESS: "프로필 조회 성공",

  // 유저
  READ_ONE_USER_SUCCESS: "유저 조회 성공",
  READ_ALL_USERS_SUCCESS: "모든 유저 조회 성공",
  UPDATE_ONE_USER_SUCCESS: "유저 수정 성공",
  DELETE_ONE_USER_SUCCESS: "유저 삭제 성공",

  // 포스트
  CREATE_ONE_POST_SUCCESS: "포스트 추가 성공",
  READ_ONE_POST_SUCCESS: "포스트 조회 성공",
  READ_ALL_POSTS_SUCCESS: "모든 포스트 조회 성공",
  UPDATE_ONE_POST_SUCCESS: "포스트 수정 성공",
  DELETE_ONE_POST_SUCCESS: "포스트 삭제 성공",
  NO_POST: "존재하지 않는 포스트입니다.",
  INCORRECT_POSTTYPEID: "올바르지 않은 포스트 타입 아이디입니다.",

  // 댓글
  CREATE_ONE_COMMENT_SUCCESS: "댓글 추가 성공",
  READ_ONE_COMMENT_SUCCESS: "댓글 조회 성공",
  READ_ALL_COMMENTS_SUCCESS: "모든 댓글 조회 성공",
  UPDATE_ONE_COMMENT_SUCCESS: "댓글 수정 성공",
  DELETE_ONE_COMMENT_SUCCESS: "댓글 삭제 성공",
  NO_COMMENT: "존재하지 않는 댓글입니다.",

  // 태그
  READ_ALL_TAGS_SUCCESS: "후기 내용 태그 리스트 조회 성공",
  NO_RELATION_POST_TAG: "존재하지 않는 후기 태그 관계입니다.",

  // 서버 내 오류
  INTERNAL_SERVER_ERROR: "서버 내 오류",

  // 토큰
  TOKEN_EXPIRED: "토큰이 만료되었습니다.",
  TOKEN_INVALID: "토큰이 유효하지 않습니다.",
  TOKEN_EMPTY: "토큰이 없습니다.",
  UPDATE_DEVICE_TOKEN_FAIL: "디바이스 토큰 업데이트 실패",

  // 인증
  NO_AUTH_HEADER: "Authorization 헤더가 없습니다.",
  FORBIDDEN_ACCESS: "사용 권한이 없습니다.",
  IS_REVIEWED_FALSE: "후기글 미등록자입니다.",

  // 전공 목록 조회
  READ_ALL_MAJORS_SUCCESS: "해당 학교의 학과 목록 조회 성공",

  // 해당 전공 데이터 조회
  READ_ONE_MAJOR_SUCCESS: "해당 학과 정보 가져오기 성공",

  // 이미지
  READ_BACKGROUND_IMAGE_SUCCESS: "후기 배경 이미지 리스트 조회 성공",

  // 필터값 오류
  INCORRECT_FILTER: "필터값이 잘못되었습니다.",
  INCORRECT_SORT: "정렬값이 잘못되었습니다.",

  // 데이터 없음
  NO_CONTENT: "찾는 데이터가 없습니다.",

  // 좋아요
  UPDATE_LIKE_SUCCESS: "포스트 좋아요 업데이트 성공",

  // 신고 성공
  REPORT_SUCCESS: "신고 성공",

  // 알림
  PUSH_ALARM_SEND_SUCCESS: "푸시 알림 전송 성공",
  PUSH_ALARM_SEND_FAIL: "푸시 알림 전송 실패",
  READ_ALL_NOTIFICATIONS_SUCCESS: "모든 알림 조회 성공",
  READ_ONE_NOTIFICATION_SUCCESS: "알림 읽기 성공",
  NO_NOTIFICATION: "존재하지 않는 알림입니다.",
};
