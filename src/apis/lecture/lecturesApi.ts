import { client } from "../client";
import type {
  FeedbackCreateResult,
  FeedbackUpdateResult,
  LectureBoard,
  LectureDetail,
  LectureListParams,
  LecturePayload,
  NavigateParams,
  SubmissionBoard,
  SubmissionDetail,
  SubmissionListParams,
  SubmissionNavigation,
} from "../../types/lecture";

/**
 * 강의 관리 API. 명세서 8.1 · 8.5 ~ 8.10.
 */

/** `GET /api/admin/lectures?trackId=&subCategoryId=` */
export async function getLectures(params: LectureListParams): Promise<LectureBoard> {
  const { data } = await client.get<LectureBoard>("/api/admin/lectures", { params });
  return data;
}

/** `DELETE /api/admin/lectures/{id}` */
export async function deleteLecture(id: number): Promise<void> {
  await client.delete(`/api/admin/lectures/${id}`);
}

/** `GET /api/admin/lectures/{id}` — 수정 폼 프리필용. 비공개 강의도 조회된다. */
export async function getLectureDetail(id: number): Promise<LectureDetail> {
  const { data } = await client.get<LectureDetail>(`/api/admin/lectures/${id}`);
  return data;
}

/** `POST /api/admin/lectures` */
export async function createLecture(payload: LecturePayload): Promise<void> {
  await client.post("/api/admin/lectures", payload);
}

/** `PUT /api/admin/lectures/{id}` */
export async function updateLecture(id: number, payload: LecturePayload): Promise<void> {
  await client.put(`/api/admin/lectures/${id}`, payload);
}

/** `GET /api/admin/lectures/{id}/submissions?submitted=&feedbackDone=&groupId=&page=` */
export async function getSubmissions(params: SubmissionListParams): Promise<SubmissionBoard> {
  const { lectureId, ...query } = params;
  const { data } = await client.get<SubmissionBoard>(`/api/admin/lectures/${lectureId}/submissions`, {
    params: query,
  });
  return data;
}

/** `GET /api/admin/submissions/{id}` */
export async function getSubmissionDetail(id: number): Promise<SubmissionDetail> {
  const { data } = await client.get<SubmissionDetail>(`/api/admin/submissions/${id}`);
  return data;
}

/** `POST /api/admin/submissions/{id}/feedback` */
export async function createFeedback(submissionId: number, content: string): Promise<FeedbackCreateResult> {
  const { data } = await client.post<FeedbackCreateResult>(`/api/admin/submissions/${submissionId}/feedback`, {
    content,
  });
  return data;
}

/** `PUT /api/admin/feedbacks/{feedbackId}` */
export async function updateFeedback(feedbackId: number, content: string): Promise<FeedbackUpdateResult> {
  const { data } = await client.put<FeedbackUpdateResult>(`/api/admin/feedbacks/${feedbackId}`, { content });
  return data;
}

/** `GET /api/admin/lectures/{id}/submissions/navigate?currentSubmissionId=&submitted=&feedbackDone=&groupId=` */
export async function navigateSubmissions(params: NavigateParams): Promise<SubmissionNavigation> {
  const { lectureId, ...query } = params;
  const { data } = await client.get<SubmissionNavigation>(`/api/admin/lectures/${lectureId}/submissions/navigate`, {
    params: query,
  });
  return data;
}
