import type { ApiErrorPayload } from "../../apis/client";

/**
 * 사이트 설정 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 도메인별로 발급한다. FE 가 새로 짓지 않는다.**
 */
const SITE_ERROR_MESSAGES: Record<string, string> = {
  ACTIVE_GENERATION_EXISTS: "이미 활성화된 기수가 있습니다. 기존 기수를 먼저 정리해 주세요.",
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

/** 저장 실패에 조회용 문구가 뜨면 무엇이 안 됐는지 알 수 없다. */
export function siteSaveErrorMessage(error: unknown): string {
  return messageFor(error, SAVE_FALLBACK);
}
