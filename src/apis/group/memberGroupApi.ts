import { client } from "../client";
import type { Group } from "../../types/group";

/** 부원 조 조회 API(BE#148). */

/**
 * `GET /api/member/group` — 파라미터 없이 로그인한 사용자 기준으로 반환한다.
 *
 * 아직 조 배정이 안 됐으면 `data: null`로 온다(BE 확인함) — 200 정상 응답이지 에러가
 * 아니다. `client.ts`의 envelope 벗기기가 `data: null`도 그대로 통과시킨다.
 */
export async function getMyGroup(): Promise<Group | null> {
  const { data } = await client.get<Group | null>("/api/member/group");
  return data;
}
