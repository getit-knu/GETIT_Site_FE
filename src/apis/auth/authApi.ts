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
