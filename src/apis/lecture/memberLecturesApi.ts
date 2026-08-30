import { client } from "../client";
import type {
  MemberDownloadUrl,
  MemberLectureBoard,
  MemberLectureDetail,
  MemberLectureListParams,
  MemberTrack,
  MemberSubmissionDetail,
  SubmissionPayload,
} from "../../types/lecture";

/**
 * 부원 강의 조회 API. 명세서 4.1 ~ 4.4, #150(트랙 목록).
 */

/** `GET /api/member/tracks` — 소분류 없거나 발행 강의가 0개인 트랙도 포함한다(#193). */
export async function getMemberTracks(): Promise<MemberTrack[]> {
  const { data } = await client.get<MemberTrack[]>("/api/member/tracks");
  return data;
}

/** `GET /api/member/lectures?trackId=&subCategoryId=&page=` */
export async function getMemberLectures(params: MemberLectureListParams): Promise<MemberLectureBoard> {
  const { data } = await client.get<MemberLectureBoard>("/api/member/lectures", { params });
  return data;
}

/** `GET /api/member/lectures/{id}` */
export async function getMemberLectureDetail(id: number): Promise<MemberLectureDetail> {
  const { data } = await client.get<MemberLectureDetail>(`/api/member/lectures/${id}`);
  return data;
}

/** `GET /api/member/lectures/{lectureId}/materials/{fileId}/download` */
export async function getMemberMaterialDownloadUrl(lectureId: number, fileId: number): Promise<MemberDownloadUrl> {
  const { data } = await client.get<MemberDownloadUrl>(
    `/api/member/lectures/${lectureId}/materials/${fileId}/download`,
  );
  return data;
}

/** `POST /api/member/assignments/{assignmentId}/submissions` */
export async function submitAssignment(
  assignmentId: number,
  payload: SubmissionPayload,
): Promise<MemberSubmissionDetail> {
  const { data } = await client.post<MemberSubmissionDetail>(
    `/api/member/assignments/${assignmentId}/submissions`,
    payload,
  );
  return data;
}

/** `PUT /api/member/submissions/{id}` — 재제출(덮어쓰기). */
export async function resubmitAssignment(
  submissionId: number,
  payload: SubmissionPayload,
): Promise<MemberSubmissionDetail> {
  const { data } = await client.put<MemberSubmissionDetail>(`/api/member/submissions/${submissionId}`, payload);
  return data;
}
