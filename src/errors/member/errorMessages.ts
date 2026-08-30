import type { ApiErrorPayload } from "../../apis/client";

/**
 * 내 정보 도메인 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 도메인별로 발급한다. FE 가 새로 짓지 않는다.**
 */
const MEMBER_ERROR_MESSAGES: Record<string, string> = {
  FORBIDDEN: "정보를 볼 권한이 없습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

const FALLBACK = "내 정보를 불러오지 못했습니다.";

export function memberErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return FALLBACK;

  const { code } = error as ApiErrorPayload;
  return MEMBER_ERROR_MESSAGES[code] ?? FALLBACK;
}
