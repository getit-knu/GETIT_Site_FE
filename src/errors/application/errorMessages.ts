import type { ApiErrorPayload } from "../../apis/client";

/**
 * 지원자 도메인 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 도메인별로 발급한다. FE 가 새로 짓지 않는다.**
 * 여기 없는 코드는 공통 대체 문구를 쓴다.
 */
const APPLICATION_ERROR_MESSAGES: Record<string, string> = {
  APPLICATION_NOT_FOUND: "지원서를 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  FORBIDDEN: "지원서를 볼 권한이 없습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
  // 지원서 양식 조회 · 임시저장 · 제출(3.1 ~ 3.4, #189에서 BE 소스로 확인함).
  ACTIVE_GENERATION_NOT_FOUND: "진행 중인 기수가 없습니다.",
  SCHEDULE_NOT_FOUND: "모집 일정을 찾을 수 없습니다.",
  APPLICATION_NOT_OPEN: "모집 기간이 아닙니다.",
  APPLICATION_DEADLINE_PASSED: "지원서 제출 기한이 지났습니다.",
  ALREADY_SUBMITTED: "이미 제출한 지원서입니다.",
  REQUIRED_ANSWER_MISSING: "필수 질문에 답변하지 않았습니다.",
  ANSWER_LENGTH_EXCEEDED: "답변이 글자 수 제한을 초과했습니다.",
  BASIC_INFO_INCOMPLETE: "이름 · 이메일 · 연락처 · 단과대학 · 전공 · 학년을 모두 입력해야 합니다.",
  // 결과 조회(3.5)만의 문맥이다 — 이 엔드포인트에서 RESOURCE_NOT_FOUND는 항상
  // "제출한 지원서가 없다"는 뜻이다(BE `ApplicationService.getResult` 참고).
  RESOURCE_NOT_FOUND: "제출한 지원서가 없습니다.",
  // 평가 점수 저장(7.3)·합불 처리(7.4, BE `ApplicationEvaluationService` 확인함).
  APPLICATION_NOT_SCORABLE: "제출된 지원서만 채점할 수 있습니다.",
  CRITERION_NOT_FOUND: "평가 기준을 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요.",
  SCORE_EXCEEDS_MAX: "점수가 배점을 초과했습니다.",
  APPLICATION_NOT_SUBMITTED: "지금 상태에서는 합불을 처리할 수 없습니다.",
  INVALID_DECISION_STATUS: "합불 처리 대상 상태가 올바르지 않습니다.",
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

/** 내 지원서 조회(3.2). 지원서가 없는 건 `null` 응답으로 오지 이 에러가 아니다. */
export const myApplicationErrorMessage = (error: unknown) => messageFor(error, "지원서를 불러오지 못했습니다.");

/** 임시 저장 실패. */
export const applicationSaveErrorMessage = (error: unknown) =>
  messageFor(error, "지원서를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");

/** 제출 실패 — 저장 실패와 문구가 다르다(뭐가 안 됐는지 헷갈리면 안 된다). */
export const applicationSubmitErrorMessage = (error: unknown) =>
  messageFor(error, "지원서를 제출하지 못했습니다. 잠시 후 다시 시도해 주세요.");

/** 결과 조회(3.5) 실패. */
export const applicationResultErrorMessage = (error: unknown) =>
  messageFor(error, "지원서 결과를 불러오지 못했습니다.");

/** 평가 점수 조회(7.3) 실패. */
export const evaluationErrorMessage = (error: unknown) => messageFor(error, "평가 점수를 불러오지 못했습니다.");

/** 평가 점수 저장(7.3) 실패. 조회 실패와 문구가 달라야 무엇이 안 됐는지 구분된다. */
export const evaluationSaveErrorMessage = (error: unknown) =>
  messageFor(error, "평가 점수를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");

/** 합불 처리(7.4, 단건·일괄 공용) 실패. */
export const decisionErrorMessage = (error: unknown) =>
  messageFor(error, "합불 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
