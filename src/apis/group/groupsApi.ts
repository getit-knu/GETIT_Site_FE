import { client } from "../client";
import type { GroupBoard } from "../../types/group";

/** 조 관리 API. */

/** `GET /api/admin/groups` — `generationId` 를 생략하면 활성 기수를 본다. */
export async function getGroups(): Promise<GroupBoard> {
  const { data } = await client.get<GroupBoard>("/api/admin/groups");
  return data;
}

/** 조 생성은 활성 기수에 만든다. 생성 전에 그 기수의 id 를 알아야 한다. */
async function getActiveGenerationId(): Promise<number> {
  const { data } = await client.get<{ id: number }>("/api/admin/setting/generation");
  return data.id;
}

/** `POST /api/admin/groups` */
export async function createGroup(name: string): Promise<void> {
  const generationId = await getActiveGenerationId();
  await client.post("/api/admin/groups", { generationId, name });
}

/** `PUT /api/admin/groups/{id}` — 이름만 바뀐다. */
export async function renameGroup(id: number, name: string): Promise<void> {
  await client.put(`/api/admin/groups/${id}`, { name });
}

/** `DELETE /api/admin/groups/{id}` — 조원은 지워지지 않고 미배정으로 돌아간다. */
export async function deleteGroup(id: number): Promise<void> {
  await client.delete(`/api/admin/groups/${id}`);
}

/**
 * `POST /api/admin/groups/{groupId}/members`
 *
 * 서버는 여러 명을 한 번에 받지만(`userIds`), 화면은 한 명씩 옮기므로 배열로 감싸서 보낸다.
 */
export async function addMember(groupId: number, userId: number): Promise<void> {
  await client.post(`/api/admin/groups/${groupId}/members`, { userIds: [userId] });
}

/** `DELETE /api/admin/groups/{groupId}/members/{userId}` */
export async function removeMember(groupId: number, userId: number): Promise<void> {
  await client.delete(`/api/admin/groups/${groupId}/members/${userId}`);
}
