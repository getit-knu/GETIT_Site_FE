import type { ApiErrorPayload } from "../../apis/client";

/**
 * 지원 시스템 설정 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 도메인별로 발급한다. FE 가 새로 짓지 않는다.**
 */
const RECRUITMENT_ERROR_MESSAGES: Record<string, string> = {
  ACTIVE_GENERATION_NOT_FOUND: "진행 중인 기수가 없습니다.",
  SCHEDULE_NOT_FOUND: "모집 일정을 찾을 수 없습니다.",
  QUESTION_NOT_FOUND: "질문 항목을 찾을 수 없습니다.",
  CRITERION_NOT_FOUND: "평가 기준을 찾을 수 없습니다.",
  // 서버는 매 쓰기마다 100 을 넘는지만 본다(`saveCriteria` 주석 참고). 화면 자체
  // validation("100점이어야 합니다")과 문구가 갈리지 않도록 여기도 "100점"을 기준으로 안내한다.
  INVALID_CRITERIA_TOTAL: "평가 기준 배점 합계가 100점을 넘었습니다. 100점에 맞춰 다시 입력해 주세요.",
  VALIDATION_FAILED: "입력한 일정이 올바르지 않습니다. 기간 순서를 확인해 주세요.",
  FORBIDDEN: "설정을 볼 권한이 없습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

const FALLBACK = "설정을 불러오지 못했습니다.";

export function recruitmentErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return FALLBACK;

  const { code, message } = error as ApiErrorPayload;
  // 배점 합계는 서버가 현재 점수까지 알려 준다. 그 문구가 더 쓸모 있다.
  if (code === "INVALID_CRITERIA_TOTAL" && message) return message;

  return RECRUITMENT_ERROR_MESSAGES[code] ?? FALLBACK;
}

/** 특정 에러 코드인지. `SCHEDULE_NOT_FOUND`처럼 에러가 아니라 정상 상태를 뜻하는 코드를 가려낼 때 쓴다. */
export function isRecruitmentErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as ApiErrorPayload).code === code;
}
