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
