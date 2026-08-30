import type { ApiErrorPayload } from "../../apis/client";

/**
 * 지원자 도메인 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 도메인별로 발급한다. FE 가 새로 짓지 않는다.**
 * 여기 없는 코드는 공통 대체 문구를 쓴다.
 */
const APPLICATION_ERROR_MESSAGES: Record<string, string> = {
  APPLICATION_NOT_FOUND: "지원서를 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  RECRUITMENT_ALREADY_STARTED: "모집이 시작되어 수정할 수 없습니다.",
  FORBIDDEN: "지원서를 볼 권한이 없습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

function messageFor(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return fallback;

  const { code } = error as ApiErrorPayload;
  return APPLICATION_ERROR_MESSAGES[code] ?? fallback;
}

export const applicationErrorMessage = (error: unknown) => messageFor(error, "지원자 목록을 불러오지 못했습니다.");

/** 다운로드는 실패 이유가 다르다. 목록 조회 문구를 쓰면 엉뚱하게 읽힌다. */
export const applicationExportErrorMessage = (error: unknown) => messageFor(error, "엑셀 다운로드에 실패했습니다.");

/** 지원서 양식 조회(본인 지원서)는 어드민 목록 조회와 문구가 다르다. */
export const applicationFormErrorMessage = (error: unknown) => messageFor(error, "지원서 양식을 불러오지 못했습니다.");
