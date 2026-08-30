import type { ApiErrorPayload } from "../../apis/client";

/**
 * 사이트 설정 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 도메인별로 발급한다. FE 가 새로 짓지 않는다.**
 */
const SITE_ERROR_MESSAGES: Record<string, string> = {
  // 진행 기수
  ACTIVE_GENERATION_NOT_FOUND: "진행 중인 기수가 없습니다.",
  ACTIVE_GENERATION_EXISTS: "이미 활성화된 기수가 있습니다. 기존 기수를 먼저 정리해 주세요.",
  // 운영진
  STAFF_NOT_FOUND: "운영진을 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  GENERATION_NOT_FOUND: "요청한 기수를 찾을 수 없습니다.",
  DUPLICATE_ORDER_ID: "순서 목록에 같은 운영진이 두 번 들어 있습니다.",
  INCOMPLETE_ORDER_SET: "구역의 운영진이 모두 포함되지 않았습니다. 새로고침 후 다시 시도해 주세요.",
  // 행사
  EVENT_NOT_FOUND: "행사를 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  GENERATION_NOT_ACTIVE: "현재 진행 중인 기수가 아닙니다.",
  INVALID_EVENT_PERIOD: "종료일이 시작일보다 빠릅니다.",
  // 커리큘럼
  CURRICULUM_NOT_FOUND: "커리큘럼을 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  // FAQ
  FAQ_NOT_FOUND: "FAQ를 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  // 강의 분류
  TRACK_NOT_FOUND: "대분류를 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  SUBCATEGORY_NOT_FOUND: "소분류를 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  CATEGORY_IN_USE: "연결된 강의가 있어 삭제할 수 없습니다.",
  // 기능 토글
  FEATURE_NOT_FOUND: "기능을 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요.",
  // 공통
  VALIDATION_FAILED: "입력값을 확인해 주세요.",
  FORBIDDEN: "사이트 설정을 바꿀 권한이 없습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

const READ_FALLBACK = "사이트 설정을 불러오지 못했습니다.";
const SAVE_FALLBACK = "사이트 설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";

function messageFor(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return fallback;

  const { code } = error as ApiErrorPayload;
  return SITE_ERROR_MESSAGES[code] ?? fallback;
}

export function siteErrorMessage(error: unknown): string {
  return messageFor(error, READ_FALLBACK);
}

/** 특정 에러 코드인지. `ACTIVE_GENERATION_NOT_FOUND`처럼 에러가 아니라 정상 상태를 뜻하는 코드를 가려낼 때 쓴다. */
export function isSiteErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as ApiErrorPayload).code === code;
}

/** 저장 실패에 조회용 문구가 뜨면 무엇이 안 됐는지 알 수 없다. */
export function siteSaveErrorMessage(error: unknown): string {
  return messageFor(error, SAVE_FALLBACK);
}
