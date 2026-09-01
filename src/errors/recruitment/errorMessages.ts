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
  /*
    이 도메인의 VALIDATION_FAILED는 일정 순서·문항 선택지 개수·재정렬 완전성 등 서로 다른
    검증에서 전부 같은 코드로 온다(BE `CommonErrorCode.VALIDATION_FAILED`) — "일정" 문구로
    고정해 두면 문항·평가 기준 화면에서 엉뚱한 오류가 뜬다(실제로 겪음: 서술형을 객관식으로
    바꿀 때 "선택지 2개 필요"가 아니라 이 일정 문구가 떴다). 아래 message 우선 처리가
    막지 못했을 때만 쓰는 최후 대체 문구라 도메인 특정 문구를 넣지 않는다.
  */
  VALIDATION_FAILED: "입력값을 확인해 주세요.",
  FORBIDDEN: "설정을 볼 권한이 없습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

const FALLBACK = "설정을 불러오지 못했습니다.";

export function recruitmentErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return FALLBACK;

  const { code, message } = error as ApiErrorPayload;
  // 배점 합계 · 검증 실패는 서버가 상황에 맞는 문구를 준다(일정 순서 · 문항 선택지 개수 ·
  // 재정렬 완전성 등, 전부 같은 VALIDATION_FAILED 코드로 온다). 그 문구가 더 쓸모 있다.
  if ((code === "INVALID_CRITERIA_TOTAL" || code === "VALIDATION_FAILED") && message) return message;

  return RECRUITMENT_ERROR_MESSAGES[code] ?? FALLBACK;
}

/** 특정 에러 코드인지. `SCHEDULE_NOT_FOUND`처럼 에러가 아니라 정상 상태를 뜻하는 코드를 가려낼 때 쓴다. */
export function isRecruitmentErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as ApiErrorPayload).code === code;
}
