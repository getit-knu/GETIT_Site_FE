import type { components } from "../../apis/generated";
import type { Page } from "../qna";

/**
 * 강의 관리 타입. API 명세서 8.1 · 8.5 ~ 8.10.
 *
 * `apis/generated.ts`(BE OpenAPI 스펙)에서 재노출한다.
 */

export type SubCategory = Required<components["schemas"]["CategorySummarySubCategoryBrief"]>;

/** 대분류. 창업 빌드업 · 세미나처럼 **소분류가 비어 있는 트랙이 있다.** */
export interface Track {
  id: number;
  name: string;
  subCategories: SubCategory[];
}

export type Lecture = Required<components["schemas"]["LectureAdminResultLectureCard"]>;

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
export type SubmissionType = NonNullable<components["schemas"]["LectureRequestAssignmentPart"]["allowedTypes"]>[number];

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
export type LectureFile = Required<components["schemas"]["LectureAdminResultFileItem"]>;

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
export type SubmissionStatus = NonNullable<components["schemas"]["SubmissionOverviewResultRow"]["status"]>;

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
export type SubmissionCounts = Required<components["schemas"]["SubmissionOverviewResultCounts"]>;

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
export type FeedbackCreateResult = Required<components["schemas"]["FeedbackResultCreateResult"]>;

/** 8.9 응답. 수정은 내용과 수정 시각만 돌아온다. */
export type FeedbackUpdateResult = Required<components["schemas"]["FeedbackResultUpdateResult"]>;

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

// ── 부원용 (명세서 4.x) ──────────────────────────────────────────────
// 관리자용(위)과 스키마 출처가 달라(BE `LectureController`/`TrackMemberController`가 각자
// 다른 DTO를 쓴다) `Member` 접두어로 구분한다. 모양이 같아 보여도 재사용하지 않는다 — 스키마가
// 나중에 갈릴 수 있다.

/** `GET /api/member/tracks`(#150·#193) 응답 한 줄. 소분류 없거나 발행 강의가 0개인 트랙도 포함한다. */
export type MemberSubCategory = Required<components["schemas"]["TrackResultSubCategory"]>;

export interface MemberTrack {
  id: number;
  name: string;
  subCategories: MemberSubCategory[];
}

export interface MemberLectureListParams {
  trackId?: number;
  subCategoryId?: number;
  page?: number;
}

/**
 * 4.1 목록 카드 한 줄.
 *
 * `subCategoryName`(소분류 없는 트랙 직속 강의)·`durationMinutes`·`deadline`(과제 없는 강의)은
 * BE `LectureService.getLectures()` 확인 — 전부 `null`일 수 있다.
 */
export interface MemberLectureCard {
  id: number;
  week: number;
  title: string;
  subCategoryName: string | null;
  trackName: string;
  durationMinutes: number | null;
  deadline: string | null;
  completed: boolean;
}

/** 4.1 응답. `tabs`는 소분류 기준이라 필터 UI엔 안 쓴다(`GET /api/member/tracks`로 대신함) — 타입에서 뺀다. */
export type MemberLectureBoard = Page<MemberLectureCard>;

export type MemberAuthor = Omit<Required<components["schemas"]["LectureResultAuthor"]>, "profileImageUrl"> & {
  profileImageUrl: string | null;
};

export type MemberMaterial = Required<components["schemas"]["LectureResultMaterial"]>;

export type MemberAssignmentInfo = Required<components["schemas"]["LectureResultAssignmentInfo"]>;

export type MemberFeedbackItem = Required<components["schemas"]["LectureResultFeedbackItem"]>;

export type MemberSubmissionStatus = NonNullable<components["schemas"]["LectureResultMySubmission"]["status"]>;

/** `file`·`linkUrl`은 제출 방식에 따라 서로 배타적이다(관리자 `SubmissionDetail`과 같은 규칙). */
export interface MemberMySubmission {
  id: number;
  fileUrl: string | null;
  fileName: string | null;
  linkUrl: string | null;
  comment: string;
  submittedAt: string;
  status: MemberSubmissionStatus;
  feedbacks: MemberFeedbackItem[];
}

/** 4.2 응답. */
export interface MemberLectureDetail {
  id: number;
  week: number;
  title: string;
  description: string;
  trackName: string;
  subCategoryName: string | null;
  durationMinutes: number | null;
  youtubeUrl: string;
  materialUrl: string;
  author: MemberAuthor;
  publishedAt: string;
  materials: MemberMaterial[];
  /** 이 강의에 과제가 없으면 `null`. */
  assignment: MemberAssignmentInfo | null;
  /** 본인이 아직 제출 안 했으면 `null`. */
  mySubmission: MemberMySubmission | null;
}

/** 4.3 응답. 비공개 저장소라 요청마다 짧게 사는 주소를 새로 받는다. */
export type MemberDownloadUrl = Required<components["schemas"]["LectureResultDownloadUrl"]>;

/** 4.4 제출·재제출 요청. `fileId`·`linkUrl` 중 최소 하나는 채워야 한다(화면에서 검증). */
export interface SubmissionPayload {
  fileId: number | null;
  linkUrl: string | null;
  comment: string;
}

/** 4.4 응답. 어드민의 `SubmissionDetail`(8.7, 위)과 이름이 겹쳐 `Member` 접두어로 구분한다. */
export interface MemberSubmissionDetail {
  id: number;
  assignmentId: number;
  fileUrl: string | null;
  fileName: string | null;
  linkUrl: string | null;
  comment: string;
  submittedAt: string;
  status: MemberSubmissionStatus;
}

/**
 * 강의 Q&A(4.6·4.7). **본인이 그 강의에 남긴 질문만 온다** — BE `getMyQuestions()`가
 * `authorId`로 필터링해서, 다른 부원이 쓴 질문은 안 보인다(공개 게시판이 아니라 개인별
 * 질문 이력).
 */
export type MemberQuestionStatus = NonNullable<components["schemas"]["MemberQuestionResultListItem"]["status"]>;

export type MemberQuestionAnswer = Required<components["schemas"]["MemberQuestionResultAnswerItem"]>;

export interface MemberQuestion {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
  status: MemberQuestionStatus;
  answers: MemberQuestionAnswer[];
}

/** 4.7 응답. */
export type MemberQuestionCreateResult = Required<components["schemas"]["MemberQuestionResultCreateResult"]>;

/**
 * 강의를 가로지르는 "내 질문" 한 줄.
 *
 * **아직 엔드포인트가 없다**(`getit-knu/GETIT_Site_BE#185`) — 지금은 강의별
 * (`/api/member/lectures/{lectureId}/questions`)로만 조회된다. 부원 대시보드는 강의와
 * 무관하게 자기 질문을 봐야 해서, 강의를 순회해 N번 부르는 대신 새 엔드포인트를 기다린다.
 *
 * `MemberQuestion` 과 달리 **어느 강의의 질문인지**가 실려 온다 — 목록만 봐선 구분이 안 된다.
 */
export interface MyQuestion extends MemberQuestion {
  lectureId: number;
  lectureTitle: string;
}
