/**
 * Azure 공개 저장소(BE `FilePurpose`가 PUBLIC인 파일). BE가 `FILE_AZURE_ENABLED=true`일 때 공개 파일이
 * 이 주소로 나간다(BE docs/DEPLOYMENT.md `AZURE_PUBLIC_ACCOUNT`·`AZURE_PUBLIC_CONTAINER`).
 */
const AZURE_PUBLIC_PREFIX = "https://getitpublic01.blob.core.windows.net/public-assets/";

/**
 * BE 로컬 저장소 모드의 공개 파일 경로. 2026-11 운영은 이 모드라 썸네일이
 * `https://api.getit.io.kr/api/public/files/public/...`로 나간다.
 */
const API_PUBLIC_FILES_PATH = "/api/public/files/";

function allowedPrefixes(): string[] {
  const apiBase = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  return [AZURE_PUBLIC_PREFIX, new URL(`${apiBase}${API_PUBLIC_FILES_PATH}`, window.location.origin).href];
}

/**
 * 우리 파일 저장소에 올린 공개 이미지인지(#384). 프로젝트 설명은 누구나 마크다운으로 쓸 수 있어,
 * 외부 주소 이미지(방문자 추적 픽셀 등)를 그리지 않으려고 이 주소들만 허용한다.
 */
export function isOurPublicFileUrl(src: string): boolean {
  let href: string;
  try {
    href = new URL(src, window.location.origin).href;
  } catch {
    return false;
  }
  return allowedPrefixes().some((prefix) => href.startsWith(prefix));
}
