import type { ApiErrorPayload } from "../../apis/client";

/**
 * 프로젝트 도메인 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 도메인별로 발급한다. FE 가 새로 짓지 않는다.**
 */
const PROJECT_ERROR_MESSAGES: Record<string, string> = {
  PROJECT_NOT_FOUND: "프로젝트를 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  VALIDATION_FAILED: "입력값을 확인해 주세요.",
  FORBIDDEN: "프로젝트를 관리할 권한이 없습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

const READ_FALLBACK = "프로젝트 목록을 불러오지 못했습니다.";
const SAVE_FALLBACK = "프로젝트를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";

function messageFor(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return fallback;

  const { code } = error as ApiErrorPayload;
  return PROJECT_ERROR_MESSAGES[code] ?? fallback;
}

export function projectErrorMessage(error: unknown): string {
  return messageFor(error, READ_FALLBACK);
}

/** 저장 실패에 조회용 문구가 뜨면 무엇이 안 됐는지 알 수 없다. */
export function projectSaveErrorMessage(error: unknown): string {
  return messageFor(error, SAVE_FALLBACK);
}
