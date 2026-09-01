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
  // 소속 수정(#199) — 화면에서도 미리 막지만, 그 사이 값이 바뀌었을 수 있어 서버 응답도 대비한다.
  AFFILIATION_INCOMPLETE: "단과대학과 학과를 함께 선택해 주세요.",
  MAJOR_NOT_IN_COLLEGE: "선택한 단과대학에 속한 학과가 아닙니다.",
  COLLEGE_NOT_FOUND: "존재하지 않는 단과대학입니다.",
  MAJOR_NOT_FOUND: "존재하지 않는 학과입니다.",
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
