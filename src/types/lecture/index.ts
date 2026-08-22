/**
 * 강의 관리 타입. API 명세서 8.1 · 8.5 ~ 8.10.
 *
 * BE 에 admin lecture 컨트롤러가 아직 없다. 스키마가 생기면 `generated.ts` 에서 가져온다.
 */
import type { Page } from "../qna";

export interface SubCategory {
  id: number;
  name: string;
}

/** 대분류. 창업 빌드업 · 세미나처럼 **소분류가 비어 있는 트랙이 있다.** */
export interface Track {
  id: number;
  name: string;
  subCategories: SubCategory[];
}

export interface Lecture {
  id: number;
  week: number;
  title: string;
  description: string;
  deadline: string;
  submittedCount: number;
  totalCount: number;
  feedbackDoneCount: number;
  /** 미공개 강의는 부원에게 보이지 않는다. */
  isPublished: boolean;
}

/**
 * 8.1 응답. **탭 구성과 목록이 한 번에 온다.**
 * 트랙을 따로 조회하지 않아도 된다.
 */
export interface LectureBoard {
  tracks: Track[];
  lectures: Lecture[];
}

export interface LectureListParams {
  trackId?: number;
  subCategoryId?: number;
}

/** 강의에 붙은 과제. 없는 강의는 `null`. */
export interface Assignment {
  id?: number;
  title: string;
  description: string;
  /** `datetime-local` 로 다루기 쉽게 문자열로 둔다. */
  deadline: string;
}

/** 이미 올라간 첨부. 수정 폼에서 목록으로 보여준다. */
export interface LectureFile {
  fileId: number;
  displayName: string;
  url: string;
  size: number;
}

/** 8.3 수정 폼 프리필용 단건 조회. */
export interface LectureDetail {
  id: number;
  generationId: number;
  trackId: number;
  subCategoryId: number | null;
  week: number;
  title: string;
  /** Markdown 원문. */
  description: string;
  youtubeUrl: string;
  materialUrl: string;
  durationMinutes: number | null;
  isPublished: boolean;
  files: LectureFile[];
  assignment: Assignment | null;
}

/** 8.2 · 8.4 요청 본문. `fileIds` 는 미리 업로드한 파일의 id 다(명세서 13.1 · 13.2). */
export interface LecturePayload {
  trackId: number;
  subCategoryId: number | null;
  week: number;
  title: string;
  description: string;
  youtubeUrl: string;
  materialUrl: string;
  durationMinutes: number | null;
  isPublished: boolean;
  fileIds: number[];
  assignment: Assignment | null;
}

/** 제출 상태 (명세서 0.4). 마감 뒤에 낸 것은 `LATE` 다 — 낸 것과 같이 볼 수 없다. */
export type SubmissionStatus = "SUBMITTED" | "LATE";

/**
 * 제출 현황 한 행 (8.6).
 *
 * **미제출자도 행으로 온다.** 그래서 제출물에 딸린 값은 전부 `null` 일 수 있다.
 * 대상은 해당 기수의 활동 중인 부원 전체다.
 */
export interface SubmissionRow {
  userId: number;
  userName: string;
  major: string;
  submissionId: number | null;
  submitted: boolean;
  status: SubmissionStatus | null;
  submittedAt: string | null;
  feedbackDone: boolean;
}

/** 필터를 걸어도 **전체 기준** 집계다. 서버가 계산해 준다. */
export interface SubmissionCounts {
  submitted: number;
  notSubmitted: number;
  total: number;
}

/** 8.6 응답. 목록에 강의 정보와 집계가 함께 실려 온다. */
export interface SubmissionBoard extends Page<SubmissionRow> {
  lecture: { id: number; title: string; deadline: string };
  counts: SubmissionCounts;
}

export interface SubmissionListParams {
  lectureId: number;
  /** 셋 다 `undefined` 면 전체다. */
  submitted?: boolean;
  feedbackDone?: boolean;
  groupId?: number;
  page?: number;
}

/**
 * 제출 파일 (8.7).
 *
 * **`previewable` 은 서버가 판정한다.** 이미지·PDF 만 인라인으로 볼 수 있고
 * 그 외(zip, docx)는 `previewUrl` 이 `null` 이라 내려받기만 된다.
 * FE 가 `contentType` 을 보고 다시 판정하면 서버와 기준이 갈린다.
 */
export interface SubmissionFile {
  fileId: number;
  fileName: string;
  url: string;
  previewUrl: string | null;
  contentType: string;
  size: number;
  previewable: boolean;
}

/** 한 제출물에 여러 건이 달린다 (submission 1 : N feedback). */
export interface Feedback {
  id: number;
  adminId: number;
  adminName: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
}

/** 순차 탐색 위치 (8.7 · 8.10). 끝이면 그쪽 id 가 `null` 이다. */
export interface SubmissionNavigation {
  current: number;
  total: number;
  prevSubmissionId: number | null;
  nextSubmissionId: number | null;
}

/** 8.7 응답. */
export interface SubmissionDetail {
  id: number;
  lecture: { id: number; title: string };
  user: { id: number; name: string; major: string };
  file: SubmissionFile;
  comment: string;
  submittedAt: string;
  status: SubmissionStatus;
  feedbacks: Feedback[];
  navigation: SubmissionNavigation;
}

/** 8.10. 목록 필터를 그대로 넘겨 같은 순서로 훑는다. */
export interface NavigateParams {
  lectureId: number;
  currentSubmissionId: number;
  submitted?: boolean;
  feedbackDone?: boolean;
  groupId?: number;
}
