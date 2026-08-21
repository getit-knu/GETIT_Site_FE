import type { AxiosError } from "axios";

import { client, type ApiErrorPayload } from "../apis/client";

/** `Content-Disposition` 에서 파일명을 꺼낸다. RFC 5987 형식(`filename*`)을 먼저 본다. */
function filenameFrom(header: string | undefined): string | null {
  if (!header) return null;

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) return decodeURIComponent(encoded[1]);

  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : null;
}

/**
 * 실패 응답은 파일이 아니라 envelope 이다.
 *
 * `responseType: "blob"` 으로 요청하면 **실패 응답까지 Blob 으로 감싸여** 온다.
 * 그대로 두면 화면이 에러 코드를 읽지 못하므로 텍스트로 풀어 다시 파싱한다.
 */
async function toApiError(error: AxiosError): Promise<ApiErrorPayload> {
  const fallback: ApiErrorPayload = { code: "UNKNOWN_ERROR", message: error.message };
  const data = error.response?.data;

  if (!(data instanceof Blob)) return fallback;

  try {
    const parsed: unknown = JSON.parse(await data.text());
    if (typeof parsed === "object" && parsed !== null && "error" in parsed) {
      return (parsed as { error: ApiErrorPayload | null }).error ?? fallback;
    }
  } catch {
    // 파일도 JSON 도 아니면 알 수 있는 게 없다.
  }
  return fallback;
}

/**
 * 파일을 내려받는다. 엑셀 다운로드(명세서 7.6 · 9.5)에 쓴다.
 *
 * @param fallbackName 서버가 `Content-Disposition` 을 주지 않을 때 쓸 이름
 */
export async function downloadFile(url: string, fallbackName: string): Promise<void> {
  let response;
  try {
    response = await client.get<Blob>(url, { responseType: "blob" });
  } catch (error) {
    throw await toApiError(error as AxiosError);
  }

  const name = filenameFrom(response.headers["content-disposition"] as string | undefined);
  const href = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");

  anchor.href = href;
  anchor.download = name ?? fallbackName;
  anchor.click();

  // 브라우저가 저장을 시작한 뒤에 풀어야 한다. 즉시 해제하면 빈 파일이 받아진다.
  setTimeout(() => URL.revokeObjectURL(href), 0);
}
