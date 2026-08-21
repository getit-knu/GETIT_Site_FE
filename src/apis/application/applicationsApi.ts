import { downloadFile } from "../../libs/downloadFile";
import * as mock from "../../mocks/application/applications";
import type { Applicant, ApplicantListParams, Page } from "../../types/application";

/**
 * 지원자 관리 API. 명세서 7.1 · 7.4 · 7.6.
 *
 * **아직 목 데이터를 돌려준다.** 연동 이슈에서 `mock.*` 만 `client.*` 로 바꾸면 된다.
 * 엑셀만은 파일 응답이라 목으로 대신할 수 없어 지금도 실제 경로를 쓴다.
 */

/** `GET /api/admin/applications?status=&evaluated=&keyword=&page=&sort=submittedAt,desc` */
export const getApplicants = (params: ApplicantListParams): Promise<Page<Applicant>> => mock.fetchApplicants(params);

/**
 * `PUT /api/admin/applications/{id}/status`
 *
 * TODO: 요청 본문 형태가 명세서에만 있고 BE 구현이 없다. `{ passed }` 로 가정했다.
 */
export const updateStatus = (id: number, passed: boolean): Promise<void> => mock.updateStatus(id, passed);

/** `GET /api/admin/applications/export` */
export const exportApplicants = (): Promise<void> =>
  downloadFile("/api/admin/applications/export", "getit-applicants.xlsx");
