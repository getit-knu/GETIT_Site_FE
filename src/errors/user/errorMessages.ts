import type { ApiErrorPayload } from "../../apis/client";

/**
 * 사용자 도메인 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 도메인별로 발급한다. FE 가 새로 짓지 않는다.**
 * 여기 없는 코드는 공통 대체 문구를 쓴다.
 */
const USER_ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: "사용자를 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  GROUP_NOT_FOUND: "조를 찾을 수 없습니다. 목록을 새로고침해 주세요.",
  DUPLICATE_GROUP_NAME: "같은 기수 안에 이미 같은 이름의 조가 있습니다.",
  ALREADY_IN_GROUP: "이미 다른 조에 속한 사용자입니다.",
  GENERATION_NOT_FOUND: "기수를 찾을 수 없습니다.",
  ACTIVE_GENERATION_NOT_FOUND: "진행 중인 기수가 없습니다.",
  // 서버는 상황(권한 변경 · 삭제)마다 다른 문구를 message 로 준다. 코드가 같아 여기선 둘 다 맞는 문구로 둔다.
  CANNOT_REMOVE_OWN_ADMIN: "자기 자신에게는 이 작업을 할 수 없습니다.",
  INVALID_GROUP_FILTER: "조 필터 값이 올바르지 않습니다.",
  GROUP_GENERATION_MISMATCH: "조의 소속 기수와 사용자의 소속 기수가 다릅니다.",
  VALIDATION_FAILED: "입력값을 확인해 주세요.",
  FORBIDDEN: "사용자를 볼 권한이 없습니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  MALFORMED_RESPONSE: "서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

function messageFor(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return fallback;

  const { code } = error as ApiErrorPayload;
  return USER_ERROR_MESSAGES[code] ?? fallback;
}

export const userErrorMessage = (error: unknown) => messageFor(error, "사용자 목록을 불러오지 못했습니다.");

/** 다운로드는 실패 이유가 다르다. 목록 조회 문구를 쓰면 엉뚱하게 읽힌다. */
export const userExportErrorMessage = (error: unknown) => messageFor(error, "엑셀 다운로드에 실패했습니다.");

/** 조 관리도 같은 도메인이다. 실패했을 때 보이는 대상만 다르다. */
export const groupErrorMessage = (error: unknown) => messageFor(error, "조 목록을 불러오지 못했습니다.");
