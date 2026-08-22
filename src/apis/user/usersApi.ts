import * as mock from "../../mocks/user/users";
import type { AdminUser, Page, UpdateUserPayload, UserListParams } from "../../types/user";
import { downloadFile } from "../../libs/downloadFile";

/**
 * 어드민 사용자 API. 명세서 9.1 ~ 9.5.
 *
 * **아직 목 데이터를 돌려준다.** 연동 이슈에서 `mock.*` 만 `client.*` 로 바꾸면 된다.
 * 엑셀만은 파일 응답이라 지금도 실제 경로를 쓴다.
 */

/** `GET /api/admin/users?role=&keyword=&page=&size=` */
export const getUsers = (params: UserListParams): Promise<Page<AdminUser>> => mock.fetchUsers(params);

/** `PUT /api/admin/users/{id}` */
export const updateUser = (id: number, payload: UpdateUserPayload): Promise<void> => mock.updateUser(id, payload);

/** `DELETE /api/admin/users/{id}` */
export const deleteUser = (id: number): Promise<void> => mock.deleteUser(id);

/** `POST /api/admin/users/promote` — 승격된 인원 수를 돌려준다. */
export const promoteApplicants = (): Promise<number> => mock.promoteApplicants();

/**
 * `GET /api/admin/users/export`
 *
 * 파일 응답이라 목으로 대신할 수 없다. BE 가 붙기 전에는 실패한다.
 */
export const exportUsers = (): Promise<void> => downloadFile("/api/admin/users/export", "getit-users.xlsx");
