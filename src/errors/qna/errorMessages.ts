import type { ApiErrorPayload } from "../../apis/client";

/**
 * Q&A 도메인 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 도메인별로 발급한다. FE 가 새로 짓지 않는다.**
 */
const QNA_ERROR_MESSAGES: Record<string, string> = {
  QUESTION_NOT_FOUND: "질문을 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  ANSWER_NOT_FOUND: "답변을 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요.",
  ALREADY_ANSWERED: "이미 답변이 등록된 질문입니다. 새로고침 후 다시 시도해 주세요.",
  NOT_RESOURCE_OWNER: "본인이 작성한 답변만 수정할 수 있습니다.",
  VALIDATION_FAILED: "답변 내용을 확인해 주세요.",
  FORBIDDEN: "Q&A를 관리할 권한이 없습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

const READ_FALLBACK = "질문 목록을 불러오지 못했습니다.";
const SAVE_FALLBACK = "답변을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";

function messageFor(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return fallback;

  const { code, message } = error as ApiErrorPayload;
  const mapped = QNA_ERROR_MESSAGES[code];
  if (mapped !== undefined) return mapped;

  // 표에 없는 코드는 BE 가 새로 추가한 것이다. 서버가 준 문구라도 쓴다.
  return typeof message === "string" && message.trim() !== "" ? message : fallback;
}

export function questionErrorMessage(error: unknown): string {
  return messageFor(error, READ_FALLBACK);
}

/** 저장 실패에 조회용 문구가 뜨면 무엇이 안 됐는지 알 수 없다. */
export function answerSaveErrorMessage(error: unknown): string {
  return messageFor(error, SAVE_FALLBACK);
}
