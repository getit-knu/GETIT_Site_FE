import type { ApiErrorPayload } from "../../apis/client";

/**
 * 파일 업로드 `ErrorCode` → 화면 문구. (컨벤션 3절)
 *
 * **에러 코드는 BE 가 발급한다. FE 가 새로 짓지 않는다.**
 */
const FILE_ERROR_MESSAGES: Record<string, string> = {
  INVALID_FILE_EXTENSION: "올릴 수 없는 형식입니다.",
  FILE_SIZE_EXCEEDED: "파일이 너무 큽니다.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  FORBIDDEN: "파일을 올릴 권한이 없습니다.",
};

const FALLBACK = "파일을 올리지 못했습니다. 잠시 후 다시 시도해 주세요.";

export function fileErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return FALLBACK;

  const { code, message } = error as ApiErrorPayload;
  const mapped = FILE_ERROR_MESSAGES[code];
  if (mapped !== undefined) return mapped;

  // 표에 없는 코드는 BE 가 새로 추가한 것이다. 서버 문구라도 보여준다.
  return typeof message === "string" && message.trim() !== "" ? message : FALLBACK;
}
