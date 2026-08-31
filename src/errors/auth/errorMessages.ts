import type { ApiErrorPayload } from "../../apis/client";

/**
 * 인증 도메인 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 도메인별로 발급한다. FE 가 새로 짓지 않는다.**
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // 프로필 수정(#147)
  NOT_PUBLIC_PROFILE_IMAGE: "프로필 사진은 본인이 올린 공개 파일만 쓸 수 있습니다.",
  NOT_RESOURCE_OWNER: "본인이 올린 파일만 프로필 사진으로 쓸 수 있습니다.",
  VALIDATION_FAILED: "입력값을 확인해 주세요.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

function messageFor(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return fallback;

  const { code } = error as ApiErrorPayload;
  return AUTH_ERROR_MESSAGES[code] ?? fallback;
}

export const meSaveErrorMessage = (error: unknown) => messageFor(error, "프로필을 저장하지 못했습니다.");
