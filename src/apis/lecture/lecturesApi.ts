import * as mock from "../../mocks/lecture/lectures";
import type { LectureBoard, LectureDetail, LectureListParams, LecturePayload } from "../../types/lecture";

/**
 * 강의 관리 API. 명세서 8.1 · 8.5.
 *
 * **아직 목 데이터를 돌려준다.** 연동 이슈에서 `mock.*` 만 `client.*` 로 바꾸면 된다.
 */

/** `GET /api/admin/lectures?trackId=&subCategoryId=&generationId=` */
export const getLectures = (params: LectureListParams): Promise<LectureBoard> => mock.fetchLectures(params);

/** `DELETE /api/admin/lectures/{id}` */
export const deleteLecture = (id: number): Promise<void> => mock.deleteLecture(id);

/** `GET /api/admin/lectures/{id}` — 수정 폼 프리필용. 비공개 강의도 조회된다. */
export const getLectureDetail = (id: number): Promise<LectureDetail> => mock.fetchLectureDetail(id);

/** `POST /api/admin/lectures` */
export const createLecture = (payload: LecturePayload): Promise<void> => mock.createLecture(payload);

/** `PUT /api/admin/lectures/{id}` */
export const updateLecture = (id: number, payload: LecturePayload): Promise<void> => mock.updateLecture(id, payload);
