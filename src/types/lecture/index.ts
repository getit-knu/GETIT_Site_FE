/**
 * 강의 관리 타입. API 명세서 8.1 · 8.5.
 *
 * BE 에 admin lecture 컨트롤러가 아직 없다. 스키마가 생기면 `generated.ts` 에서 가져온다.
 */
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
