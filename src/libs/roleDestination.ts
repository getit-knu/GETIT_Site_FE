import type { Role } from "../types/auth";

/**
 * 역할별 로그인 후 도착지. `OAuthCallbackPage`·`OnboardingPage`가 함께 쓴다.
 *
 * 아직 승인 전인 GUEST는 갈 곳이 없어 홈에 남는다.
 */
export function destinationFor(role: Role): string {
  if (role === "ADMIN") return "/admin";
  if (role === "MEMBER") return "/member";
  return "/";
}
