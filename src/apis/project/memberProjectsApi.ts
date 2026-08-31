import { client } from "../client";
import type { MemberProject, ProjectSubmitPayload } from "../../types/project";

/** 부원 프로젝트 등록 API(BE#148). */

/** `POST /api/member/projects` — 호출자의 조 명의로 등록한다. 승인 전엔 `PENDING`. */
export async function submitProject(payload: ProjectSubmitPayload): Promise<MemberProject> {
  const { data } = await client.post<MemberProject>("/api/member/projects", payload);
  return data;
}
