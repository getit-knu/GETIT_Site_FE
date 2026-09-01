import { client } from "../client";
import type { MemberProject, ProjectSubmitPayload } from "../../types/project";

/** 부원 프로젝트 등록·조회 API(BE#148 · #190). */

/** `POST /api/member/projects` — 호출자의 조 명의로 등록한다. 승인 전엔 `PENDING`. */
export async function submitProject(payload: ProjectSubmitPayload): Promise<MemberProject> {
  const { data } = await client.post<MemberProject>("/api/member/projects", payload);
  return data;
}

/** `GET /api/member/projects` — 내 조가 낸 프로젝트 전체(#296). 등록한 사람이 아니어도 같은 조원이면 보인다. */
export async function getMyProjects(): Promise<MemberProject[]> {
  const { data } = await client.get<MemberProject[]>("/api/member/projects");
  return data;
}
