import type { ApiErrorPayload } from "../../apis/client";

/**
 * 강의 도메인 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 도메인별로 발급한다. FE 가 새로 짓지 않는다.**
 * 여기 없는 코드는 공통 대체 문구를 쓴다 — BE 가 코드를 추가해도 화면이 빈 문구를 보이지 않는다.
 */
const LECTURE_ERROR_MESSAGES: Record<string, string> = {
  LECTURE_NOT_FOUND: "강의를 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  FORBIDDEN: "강의를 볼 권한이 없습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

const READ_FALLBACK = "강의 목록을 불러오지 못했습니다.";
const SAVE_FALLBACK = "강의를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";

function messageFor(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return fallback;

  const { code, message } = error as ApiErrorPayload;
  const mapped = LECTURE_ERROR_MESSAGES[code];
  if (mapped !== undefined) return mapped;

  /*
    표에 없는 코드는 BE 가 새로 추가한 것이다. 고정 문구를 보여주면 무엇이 잘못됐는지
    알 수 없으니 서버가 준 문구라도 쓴다. 그마저 없을 때만 대체 문구로 간다.
  */
  return typeof message === "string" && message.trim() !== "" ? message : fallback;
}

/** 알 수 없는 코드에는 공통 문구를 쓴다. */
export function lectureErrorMessage(error: unknown): string {
  return messageFor(error, READ_FALLBACK);
}

/**
 * 저장(추가·수정) 실패 문구.
 *
 * 조회 실패와 대체 문구가 달라야 한다 — 저장에 실패했는데 "목록을 불러오지 못했습니다"
 * 라고 하면 무엇이 안 됐는지 알 수 없다. 쓰기 전용 에러 코드는 BE 가 강의 도메인을
 * 구현하면서 발급한다. 그때 위 표에 추가한다.
 */
export function lectureSaveErrorMessage(error: unknown): string {
  return messageFor(error, SAVE_FALLBACK);
}

/** 제출물 · 피드백 코드 (명세서 8.7 ~ 8.9). */
const FEEDBACK_ERROR_MESSAGES: Record<string, string> = {
  SUBMISSION_NOT_FOUND: "제출물을 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  FEEDBACK_NOT_FOUND: "피드백을 찾을 수 없습니다. 이미 지워졌을 수 있습니다.",
  NOT_RESOURCE_OWNER: "본인이 작성한 피드백만 수정할 수 있습니다.",
  FORBIDDEN: "피드백을 남길 권한이 없습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
};

const FEEDBACK_FALLBACK = "피드백을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";

/**
 * 조회 실패와 문구가 갈려야 한다 — 피드백 저장에 실패했는데 "강의 목록을 불러오지
 * 못했습니다" 가 뜨면 무엇이 안 됐는지 알 수 없다.
 */
export function feedbackErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return FEEDBACK_FALLBACK;

  const { code } = error as ApiErrorPayload;
  return FEEDBACK_ERROR_MESSAGES[code] ?? FEEDBACK_FALLBACK;
}
