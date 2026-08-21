import * as mock from "../../mocks/lecture/lectures";
import type { LectureBoard, LectureListParams } from "../../types/lecture";

/**
 * 강의 관리 API. 명세서 8.1 · 8.5.
 *
 * **아직 목 데이터를 돌려준다.** 연동 이슈에서 `mock.*` 만 `client.*` 로 바꾸면 된다.
 */

/** `GET /api/admin/lectures?trackId=&subCategoryId=&generationId=` */
export const getLectures = (params: LectureListParams): Promise<LectureBoard> => mock.fetchLectures(params);

/** `DELETE /api/admin/lectures/{id}` */
export const deleteLecture = (id: number): Promise<void> => mock.deleteLecture(id);
