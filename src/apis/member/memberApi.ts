import { client } from "../client";
import type { MySummary } from "../../types/member";

/** `GET /api/member/me/summary` — 내 정보·학습 통계. 명세서 4.5. */
export async function getMySummary(): Promise<MySummary> {
  const { data } = await client.get<MySummary>("/api/member/me/summary");
  return data;
}
