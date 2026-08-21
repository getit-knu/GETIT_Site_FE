import { client } from "../apis/client";

/** `Content-Disposition` 에서 파일명을 꺼낸다. RFC 5987 형식(`filename*`)을 먼저 본다. */
function filenameFrom(header: string | undefined): string | null {
  if (!header) return null;

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) return decodeURIComponent(encoded[1]);

  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : null;
}

/**
 * 파일을 내려받는다. 엑셀 다운로드(명세서 7.6 · 9.5)에 쓴다.
 *
 * @param fallbackName 서버가 `Content-Disposition` 을 주지 않을 때 쓸 이름
 */
export async function downloadFile(url: string, fallbackName: string): Promise<void> {
  // 실패는 인터셉터가 이미 ApiErrorPayload 로 바꿔 던진다. Blob 해석도 거기서 한다.
  const response = await client.get<Blob>(url, { responseType: "blob" });

  const name = filenameFrom(response.headers["content-disposition"] as string | undefined);
  const href = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");

  anchor.href = href;
  anchor.download = name ?? fallbackName;
  anchor.click();

  // 브라우저가 저장을 시작한 뒤에 풀어야 한다. 즉시 해제하면 빈 파일이 받아진다.
  setTimeout(() => URL.revokeObjectURL(href), 0);
}
