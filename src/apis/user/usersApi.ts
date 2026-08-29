import { client } from "../client";
import type { AdminUser, Page, PromotionResult, UpdateUserPayload, UserListParams } from "../../types/user";
import { downloadFile } from "../../libs/downloadFile";

/** 어드민 사용자 API. */

/** `GET /api/admin/users?keyword=&role=&groupId=&generationNo=&page=&size=` */
export async function getUsers(params: UserListParams): Promise<Page<AdminUser>> {
  const { data } = await client.get<Page<AdminUser>>("/api/admin/users", { params });
  return data;
}

/** `PUT /api/admin/users/{id}` — 보낸 필드만 바뀐다. */
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<AdminUser> {
  const { data } = await client.put<AdminUser>(`/api/admin/users/${id}`, payload);
  return data;
}

/** `DELETE /api/admin/users/{id}` — 소프트 삭제. 자기 자신은 지울 수 없다(서버가 막는다). */
export async function deleteUser(id: number): Promise<void> {
  await client.delete(`/api/admin/users/${id}`);
}

/** 승격 대상은 **현재 활성 기수**뿐이다. 승격 전에 그 기수의 id 를 알아야 한다. */
async function getActiveGenerationId(): Promise<number> {
  const { data } = await client.get<{ id: number }>("/api/admin/setting/generation");
  return data.id;
}

/** `POST /api/admin/users/promote` — 활성 기수의 서류 최종 합격자를 전부 부원으로 올린다. */
export async function promoteApplicants(): Promise<PromotionResult> {
  const generationId = await getActiveGenerationId();
  const { data } = await client.post<PromotionResult>("/api/admin/users/promote", { generationId });
  return data;
}

/**
 * `GET /api/admin/users/export`
 *
 * 파일 응답이다(`ApiResponse` 로 감싸지 않는다) — `client` 의 blob 예외 처리를 그대로 탄다.
 */
export const exportUsers = (): Promise<void> => downloadFile("/api/admin/users/export", "getit-users.xlsx");
