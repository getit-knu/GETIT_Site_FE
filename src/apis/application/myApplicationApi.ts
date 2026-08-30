import { client } from "../client";
import type { ApplicationFormResult } from "../../types/application";

/**
 * 내 지원서 API. 명세서 3.1 이하.
 *
 * `applicationsApi.ts`(어드민 지원자 관리)와는 다른 파일이다 — 로그인한 지원자 본인이
 * 자기 지원서를 조회·작성하는 API라 사용자·권한이 다르다.
 */

/** `GET /api/applications/form` — 지원서 양식 조회(3.1). 로그인이 필요하다. */
export async function getForm(): Promise<ApplicationFormResult> {
  const { data } = await client.get<ApplicationFormResult>("/api/applications/form");
  return data;
}
