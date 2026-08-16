import type { Me, TokenResponse } from "../../types/auth";
import { client } from "../client";

/** 로그인한 사용자 본인. 앱 진입 시 이 응답으로 권한을 판단한다. (명세서 1.5) */
export async function getMe(): Promise<Me> {
  const { data } = await client.get<Me>("/api/auth/me");
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
