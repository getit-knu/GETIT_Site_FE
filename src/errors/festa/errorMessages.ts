import type { ApiErrorPayload } from "../../apis/client";

/**
 * FESTA 도메인 `ErrorCode`(BE `FestaErrorCode`) → 화면 문구. (컨벤션 3절)
 *
 * 화면이 미리 막는 것(합계·단위·번호 형식·동의)도 다 적어 둔다 — 출전 목록이 그사이 바뀌는 등
 * 화면이 모르는 이유로 서버가 거절할 수 있다.
 */
const FESTA_ERROR_MESSAGES: Record<string, string> = {
  FESTA_CLOSED: "모의투자가 마감되어 더는 바꿀 수 없어요.",
  DUPLICATE_PROJECT: "같은 프로젝트가 두 번 담겼어요. 새로고침한 뒤 다시 시도해 주세요.",
  INVALID_AMOUNT: "투자금은 10만 원 단위로만 넣을 수 있어요.",
  BUDGET_EXCEEDED: "가진 투자금보다 많이 넣었어요.",
  PROJECT_NOT_ENTERED: "출전하지 않는 프로젝트가 담겼어요. 새로고침한 뒤 다시 시도해 주세요.",
  OWN_GROUP_PROJECT: "우리 조 프로젝트에는 투자할 수 없어요.",
  INVALID_PHONE_NUMBER: "전화번호를 010-1234-5678 형식으로 입력해 주세요.",
  PHONE_NUMBER_REQUIRED: "경품 추첨에 쓸 전화번호를 입력해 주세요.",
  PRIVACY_CONSENT_REQUIRED: "전화번호 수집·이용에 동의해 주세요.",
  UNAUTHORIZED: "로그인이 필요해요. 다시 로그인해 주세요.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했어요. 잠시 후 다시 시도해 주세요.",
};

const READ_FALLBACK = "내 투자 현황을 불러오지 못했어요.";
const SAVE_FALLBACK = "투자를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.";

function messageFor(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return fallback;

  const { code } = error as ApiErrorPayload;
  return FESTA_ERROR_MESSAGES[code] ?? fallback;
}

export function festaErrorMessage(error: unknown): string {
  return messageFor(error, READ_FALLBACK);
}

export function festaSaveErrorMessage(error: unknown): string {
  return messageFor(error, SAVE_FALLBACK);
}
