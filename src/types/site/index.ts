/**
 * 사이트 설정 타입. API 명세서 10절.
 *
 * BE 에 admin setting 컨트롤러가 아직 없다. 스키마가 생기면 `generated.ts` 에서 가져온다.
 */

/** 10.1 진행 기수. 활성 기수는 하나뿐이다. */
export interface Generation {
  id: number;
  generationNo: number;
  year: number;
  isActive: boolean;
}

/**
 * 모집 일정 (10.20 의 `schedule`).
 *
 * ⚠️ **6.1 · 6.2 `/admin/recruitment/schedule` 과 같은 데이터다.** 명세서가 두 경로로
 * 같은 값을 열어 두었고, 지원서 관리 설정 탭(#71)도 이 값을 고친다.
 * 여기서는 10.20 요청 본문의 계약만 다룬다 — 어느 화면이 주인인지는 팀이 정할 문제다.
 *
 * `interviewEndAt` 은 서버가 `totalEndAt` 으로 맞추므로 보내지 않는다.
 */
export interface SiteSchedule {
  totalStartAt: string;
  totalEndAt: string;
  documentStartAt: string;
  documentEndAt: string;
  interviewStartAt: string;
}

/** 10.3 강의 분류. `order` · `lectureCount` 는 조회에만 있다. */
export interface SiteSubCategory {
  id: number | null;
  name: string;
}

export interface SiteTrack {
  id: number | null;
  name: string;
  subCategories: SiteSubCategory[];
}

/** 10.10 커리큘럼. */
export interface Curriculum {
  id: number | null;
  title: string;
  subtitle: string;
}

/**
 * 10.14 행사 종류 (명세서 0.4 `EventType`).
 *
 * **`types/dashboard` 에도 `EventType` 이 있고 값이 다르다**(대시보드는 `WORKSHOP` 이 없다).
 * 한 파일에서 둘을 함께 쓰면 이름이 부딪히므로 도메인 접두어를 붙인다.
 */
export type SiteEventType = "COMPETITION" | "WORKSHOP" | "EVENT";

export interface SiteEvent {
  id: number | null;
  title: string;
  startDate: string;
  endDate: string;
  type: SiteEventType;
}

/** 10.18 FAQ. */
export interface Faq {
  id: number | null;
  question: string;
  answer: string;
}

/**
 * 사이트 관리 화면이 들고 있는 전체 상태.
 *
 * **10.20 은 개별 CRUD 가 아니라 화면 전체를 한 트랜잭션으로 반영한다.**
 * 그래서 일부만 보내면 **나머지 섹션이 지워진다.** 아직 편집 화면이 없는 섹션도
 * 조회해서 그대로 되돌려 보내야 한다.
 */
export interface SiteSettings {
  generation: Generation;
  schedule: SiteSchedule;
  tracks: SiteTrack[];
  curriculums: Curriculum[];
  events: SiteEvent[];
  faqs: Faq[];
}

/** 10.20 요청 본문. 조회 전용 필드(`id` 의 일부 · `isActive`)는 빠진다. */
export interface SiteSavePayload {
  generation: { generationNo: number; year: number };
  schedule: SiteSchedule;
  tracks: SiteTrack[];
  curriculums: Curriculum[];
  events: SiteEvent[];
  faqs: Faq[];
}
