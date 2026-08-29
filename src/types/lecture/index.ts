/**
 * 강의 관리 타입. API 명세서 8.1 · 8.5 ~ 8.10.
 *
 * **`generated.ts` 를 쓰지 않고 손으로 옮긴다.** BE `LectureRequest.Create`/`Update`,
 * `LectureAdminResult.ListResult`/`DetailResult`, `SubmissionDetailResult.Detail` 같은
 * 중첩 클래스 이름이 다른 도메인의 동명 중첩 클래스와 충돌해서(springdoc이 바깥 클래스
 * 없이 단순 이름으로만 스키마를 등록한다), `components["schemas"]["Create"]` 같은 이름이
 * 실제로는 완전히 다른 도메인의 모양을 가리키는 경우가 있다(실제 확인함 — `createLecture`가
 * 참조하는 `Create` 스키마가 강의 도메인이 아니라 `{content: string}` 뿐인 다른 도메인
 * 것으로 덮어써져 있었다). 그래서 이 도메인은 BE Java 소스(`domain/lecture/admin/dto/*`)를
 * 직접 읽고 그 필드 그대로 옮겼다.
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

/** 과제 제출 방식. `allowedTypes`에 담긴 것만 받는다(파일·링크 둘 다 열어둘 수 있다). */
export type SubmissionType = "FILE" | "LINK";

/** 강의에 붙은 과제(응답). 없는 강의는 `null`. */
export interface Assignment {
  id: number;
  title: string;
  description: string;
  /** `datetime-local` 로 다루기 쉽게 문자열로 둔다. */
  deadline: string;
  allowedTypes: SubmissionType[];
  /** `LINK`를 허용할 때 입력창에 보여줄 placeholder(예: "구글 드라이브 링크"). */
  linkPlaceholder: string | null;
}

/** 강의 저장(추가·수정) 요청에 함께 보내는 과제. 응답과 달리 `id`가 없다. */
export interface AssignmentPayload {
  title: string;
  description: string;
  deadline: string;
  allowedTypes: SubmissionType[];
  linkPlaceholder: string | null;
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
  assignment: AssignmentPayload | null;
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

/** 한 제출물에 여러 건이 달린다 (submission 1 : N feedback). 제출 상세(8.7)에 실려 온다. */
export interface Feedback {
  id: number;
  adminId: number;
  adminName: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * 8.8 응답. **`Feedback` 과 모양이 다르다.** `adminId`·`updatedAt` 대신 `submissionId` 가 온다 —
 * 새로 단 피드백엔 아직 수정 이력이 없기 때문이다.
 */
export interface FeedbackCreateResult {
  id: number;
  submissionId: number;
  adminName: string;
  content: string;
  createdAt: string;
}

/** 8.9 응답. 수정은 내용과 수정 시각만 돌아온다. */
export interface FeedbackUpdateResult {
  id: number;
  content: string;
  updatedAt: string;
}

/** 순차 탐색 위치 (8.7 · 8.10). 끝이면 그쪽 id 가 `null` 이다. */
export interface SubmissionNavigation {
  current: number;
  total: number;
  prevSubmissionId: number | null;
  nextSubmissionId: number | null;
}

/**
 * 8.7 응답.
 *
 * **`file`·`linkUrl`은 서로 배타적이다.** 과제가 `FILE`로 제출됐으면 `file`만,
 * `LINK`로 제출됐으면 `linkUrl`만 채워진다(`Assignment.allowedTypes`가 둘 다 허용해도
 * 실제 제출 하나는 둘 중 한 방식으로만 온다).
 */
export interface SubmissionDetail {
  id: number;
  lecture: { id: number; title: string };
  user: { id: number; name: string; major: string };
  file: SubmissionFile | null;
  linkUrl: string | null;
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
