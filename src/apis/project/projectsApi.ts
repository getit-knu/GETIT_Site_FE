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
