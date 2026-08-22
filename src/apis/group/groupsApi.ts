import * as mock from "../../mocks/group/groups";
import type { GroupBoard } from "../../types/group";

/**
 * 조 관리 API. 명세서 9.6 ~ 9.11.
 *
 * **아직 목 데이터를 돌려준다.** 연동 이슈에서 `mock.*` 만 `client.*` 로 바꾸면 된다.
 */

/** `GET /api/admin/groups?generationId=` — 기본값은 활성 기수다. */
export const getGroups = (): Promise<GroupBoard> => mock.fetchGroups();

/** `POST /api/admin/groups` */
export const createGroup = (name: string): Promise<void> => mock.createGroup(name);

/** `PUT /api/admin/groups/{id}` */
export const renameGroup = (id: number, name: string): Promise<void> => mock.renameGroup(id, name);

/** `DELETE /api/admin/groups/{id}` */
export const deleteGroup = (id: number): Promise<void> => mock.deleteGroup(id);

/** `POST /api/admin/groups/{groupId}/members` */
export const addMember = (groupId: number, userId: number): Promise<void> => mock.addMember(groupId, userId);

/** `DELETE /api/admin/groups/{groupId}/members/{userId}` */
export const removeMember = (groupId: number, userId: number): Promise<void> => mock.removeMember(groupId, userId);
