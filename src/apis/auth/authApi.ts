import type { Me, MeUpdatePayload, TokenResponse } from "../../types/auth";
import { client } from "../client";

/** 로그인한 사용자 본인. 앱 진입 시 이 응답으로 권한을 판단한다. (명세서 1.5) */
export async function getMe(): Promise<Me> {
  const { data } = await client.get<Me>("/api/auth/me");
  return data;
}

/** `PUT /api/auth/me` — 본인 프로필 수정(#147). 세 role 모두 호출 가능. */
export async function updateMe(payload: MeUpdatePayload): Promise<Me> {
  const { data } = await client.put<Me>("/api/auth/me", payload);
  return data;
}

/**
 * 개인정보 수집·이용 동의를 서버에 기록한다. `OnboardingPage`(신규 유저 전용)에서만 부른다.
 *
 * **BE에 아직 이 엔드포인트가 없다** — `getit-knu/GETIT_Site_BE#203`에서 만들기로 한 가칭 경로를
 * 그대로 썼다. 실제 경로·이름이 다르게 정해지면 여기만 고치면 된다(호출부는 이 함수만 안다).
 * 그 이슈가 끝나기 전까지는 이 함수를 부르면 404가 난다 — BE가 준비되기 전엔 이 기능을
 * 배포하지 않는다.
 */
export async function confirmPrivacyConsent(): Promise<Me> {
  const { data } = await client.post<Me>("/api/auth/consent");
  return data;
}

/**
 * Access Token 재발급. (명세서 1.3)
 *
 * Refresh Token 은 HttpOnly 쿠키라 여기서 직접 넘기지 않는다.
 * `withCredentials` 로 브라우저가 알아서 실어 보낸다.
 */
export async function refreshAccessToken(): Promise<TokenResponse> {
  const { data } = await client.post<TokenResponse>("/api/auth/refresh");
  return data;
}

/**
 * 로그아웃. BE 가 Refresh Token 을 폐기하고 쿠키를 지운다.
 *
 * Access Token 은 서버가 지울 수 없다. 만료까지는 유효하므로 호출한 쪽에서
 * 메모리 저장소를 함께 비워야 한다.
 */
export async function logout(): Promise<void> {
  await client.post("/api/auth/logout");
}
