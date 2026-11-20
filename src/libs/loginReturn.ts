/**
 * 로그인하고 나서 돌아올 곳(#364). FESTA 쇼케이스처럼 "로그인하고 이어서 하기"가 필요한 화면이
 * 구글 로그인으로 보내기 직전에 경로를 적어 두고, 로그인을 마친 쪽(`OAuthCallbackPage`·
 * `OnboardingPage`)이 꺼내 쓴다.
 *
 * 구글을 거쳐 BE 콜백으로 돌아오는 동안 SPA 상태는 다 사라지므로 `sessionStorage`에 둔다 —
 * 탭을 닫으면 함께 사라져, 오래 묵은 경로가 엉뚱한 로그인 뒤에 튀어나오지 않는다.
 */

const STORAGE_KEY = "getit.loginReturnPath";

/** 구글 로그인 시작 주소. BE 가 받은 뒤 `/oauth/callback`으로 돌려보낸다. */
export function googleLoginUrl(): string {
  return `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google`;
}

/**
 * 우리 사이트 안의 경로만 받는다. `//evil.com`·`/\evil.com`은 브라우저가 다른 호스트로 읽어
 * 로그인 직후 외부로 튕겨 내는 오픈 리다이렉트가 된다.
 */
function isInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

export function rememberReturnPath(path: string): void {
  if (!isInternalPath(path)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    // 사파리 사생활 보호 모드 등에서 저장이 막혀도 로그인 자체는 되어야 한다 — 역할별 기본 도착지로 간다.
  }
}

export function clearReturnPath(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 위와 같다.
  }
}

/** 적어 둔 경로를 꺼내고 지운다. 한 번 쓰면 끝이다. */
export function takeReturnPath(): string | null {
  let path: string | null;
  try {
    path = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  clearReturnPath();
  return path !== null && isInternalPath(path) ? path : null;
}
