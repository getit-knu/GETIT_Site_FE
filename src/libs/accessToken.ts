/**
 * Access Token 저장소.
 *
 * 메모리에만 둔다. `localStorage` 에 넣으면 XSS 한 번으로 토큰이 통째로 새어 나가고,
 * 그렇게 되면 BE 가 Refresh Token 을 HttpOnly 쿠키로 내려보내는 이유가 사라진다.
 *
 * 새로고침하면 사라지지만 문제가 되지 않는다. Refresh 쿠키가 살아 있으므로
 * 앱 진입 시 `POST /api/auth/refresh` 로 다시 받는다.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}
