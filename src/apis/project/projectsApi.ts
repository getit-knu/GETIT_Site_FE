import { client } from "../client";
import type { AdminProject, AdminProjectBoard, AdminProjectListParams, AdminProjectPayload } from "../../types/project";

/** 어드민 프로젝트 관리 API(#222). */

/** `GET /api/admin/projects?semester=&page=&size=` */
export async function getProjects(params: AdminProjectListParams): Promise<AdminProjectBoard> {
  const { data } = await client.get<AdminProjectBoard>("/api/admin/projects", { params });
  return data;
}

/** `POST /api/admin/projects` */
export async function createProject(payload: AdminProjectPayload): Promise<AdminProject> {
  const { data } = await client.post<AdminProject>("/api/admin/projects", payload);
  return data;
}

/** `PUT /api/admin/projects/{id}` */
export async function updateProject(id: number, payload: AdminProjectPayload): Promise<AdminProject> {
  const { data } = await client.put<AdminProject>(`/api/admin/projects/${id}`, payload);
  return data;
}

/** `DELETE /api/admin/projects/{id}` */
export async function deleteProject(id: number): Promise<void> {
  await client.delete(`/api/admin/projects/${id}`);
}

/**
 * `POST /api/admin/projects/{id}/approve` (#148)
 *
 * 반려한 것도 다시 승인할 수 있다 — BE 는 `PENDING` 에서만 오는 것으로 보지 않는다.
 */
export async function approveProject(id: number): Promise<AdminProject> {
  const { data } = await client.post<AdminProject>(`/api/admin/projects/${id}/approve`);
  return data;
}

/** `POST /api/admin/projects/{id}/reject` (#148). 반려 사유는 아직 서버가 받지 않는다. */
export async function rejectProject(id: number): Promise<AdminProject> {
  const { data } = await client.post<AdminProject>(`/api/admin/projects/${id}/reject`);
  return data;
}
