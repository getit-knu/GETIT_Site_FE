import type { components } from "../../apis/generated";

/**
 * 사이트 설정 타입.
 *
 * **진행 기수 · 운영진 · 행사 · 커리큘럼은 실제 BE `Setting` 도메인(각각 별도 컨트롤러)에서
 * 가져온다.** 이 부분은 `generated.ts` 를 쓰지 않는다 — 이 BE는 중첩 클래스 이름이 다른
 * 도메인과 겹치면 springdoc이 스키마를 잘못 등록하는 버그가 있다(`types/lecture/index.ts`
 * 상단 주석에 실제 확인한 사례가 있다). 그래서 `domain/setting/*` 의 Java 소스를 직접
 * 읽고 그 필드 그대로 옮겼다.
 *
 * **공개 운영진 조회(`PublicStaff` 이하)는 다르다** — 이미 스키마가 있어 `generated.ts`
 * 에서 그대로 재노출한다.
 *
 * 모집 일정 · FAQ는 아직 BE 연동 전이라(각각 #190·미배정) 목 데이터로 남는다.
 *
 * **강의 분류(트랙 · 소분류)는 다르다** — `#195`에서 실제 `Setting.Category` 도메인으로
 * 교체했다. 스키마 이름 충돌 버그(`getit-knu/GETIT_Site_BE#137`)가 `#138`로 고쳐진 뒤라
 * `generated.ts`에서 그대로 재노출한다.
 */

/** 진행 기수. 활성 기수는 하나뿐이다 — `PUT` 으로 새 기수를 활성화하면 기존 기수는 내려간다. */
export interface Generation {
  id: number;
  generationNo: number;
  year: number;
  isActive: boolean;
}

/** `PUT /api/admin/setting/generation` 요청 본문. 시작·종료일은 없다 — 그건 모집 일정(별개 도메인)의 값이다. */
export interface GenerationPayload {
  generationNo: number;
  year: number;
}

/**
 * 모집 일정.
 *
 * ⚠️ **`/admin/recruitment/schedule` 과 같은 개념의 데이터지만 별개 도메인이다(BE 확인함,
 * `Generation` 엔티티에는 시작·종료일 필드가 아예 없다).** 이 화면은 아직 이 값을 저장할
 * 실제 엔드포인트가 없어 목으로 남긴다 — 어느 화면이 주인인지는 팀이 정할 문제다.
 */
export interface SiteSchedule {
  totalStartAt: string;
  totalEndAt: string;
  documentStartAt: string;
  documentEndAt: string;
  interviewStartAt: string;
}

/** 강의 분류 소분류. `lectureCount`는 삭제 전 안내용(서버도 `CATEGORY_IN_USE`로 별도 막는다). */
export type SiteSubCategory = Required<components["schemas"]["CategoryTreeResultSubCategoryNode"]>;

/** 10.3 응답. 대분류 하나 + 그 아래 소분류 목록. */
export interface SiteTrack {
  id: number;
  name: string;
  order: number;
  subCategories: SiteSubCategory[];
}

/**
 * 10.4 · 10.5 요청 본문. 생성·수정 둘 다 이름뿐이다 — `order`는 생성 스키마엔 아예 없고
 * (새 대분류는 항상 끝에 붙는다), 수정 스키마엔 있지만 이 화면엔 순서 변경 UI가 없어 안 쓴다.
 */
export interface TrackPayload {
  name: string;
}

/** 10.7 요청 본문. 수정(10.8)은 `trackId` 없이 `name`만 보낸다. */
export interface SubCategoryPayload {
  trackId: number;
  name: string;
}

/**
 * 커리큘럼.
 *
 * **트랙·주차 연결이 없다** — `order`(순번) + `title` + `subtitle` 뿐이다(BE 확인함).
 * **별도 순서 변경 엔드포인트도 없다** — 추가·수정 요청에 `order` 를 직접 실어 보내면
 * 서버가 그 사이로 끼워 넣고 나머지를 밀어 채운다.
 */
export interface Curriculum {
  id: number;
  order: number;
  title: string;
  subtitle: string;
}

/** `POST`/`PUT /api/admin/setting/curriculums` 요청 본문. */
export interface CurriculumPayload {
  generationId: number;
  title: string;
  subtitle: string;
  order: number;
}

/**
 * 행사 종류 (BE `EventType` enum).
 *
 * **`types/dashboard` 에도 `EventType` 이 있고 값이 다르다**(대시보드는 `WORKSHOP` 이 없다).
 * 한 파일에서 둘을 함께 쓰면 이름이 부딪히므로 도메인 접두어를 붙인다.
 */
export type SiteEventType = "COMPETITION" | "WORKSHOP" | "EVENT";

/** 행사 일정. `isVisible` 이 꺼진 행사는 공개 캘린더(`GET /api/public/events`)에 안 뜬다. */
export interface SiteEvent {
  id: number;
  title: string;
  place: string;
  startDate: string;
  endDate: string;
  type: SiteEventType;
  isVisible: boolean;
}

/** `POST`/`PUT /api/admin/setting/events` 요청 본문. */
export interface SiteEventPayload {
  generationId: number;
  title: string;
  place: string;
  startDate: string;
  endDate: string;
  type: SiteEventType;
  isVisible: boolean;
}

/** FAQ. 아직 실제 엔드포인트가 없어 목으로 남긴다. */
export interface Faq {
  id: number | null;
  question: string;
  answer: string;
}

/**
 * 아직 실제 엔드포인트가 없는 섹션들의 묶음(모집 일정 · FAQ).
 *
 * **진행 기수 · 운영진 · 행사 · 커리큘럼 · 강의 분류는 여기 없다** — 각자 실제 CRUD
 * 엔드포인트로 개별 반영된다(#194 · #195).
 */
export interface SiteSettings {
  schedule: SiteSchedule;
  faqs: Faq[];
}

export type SiteSavePayload = SiteSettings;

/** 운영진 구역. 순서는 **구역 안에서만** 다시 매긴다(`PUT .../staffs/order`). */
export type StaffSection = "EXECUTIVE" | "SW" | "STARTUP";

/** 운영진 프로필. 개별 엔드포인트로 즉시 반영된다. */
export interface Staff {
  id: number;
  /** 실제 계정 연결. 없으면 표시 전용 프로필이다. */
  userId: number | null;
  name: string;
  staffRole: string;
  section: StaffSection;
  department: string;
  introduction: string;
  profileImageUrl: string | null;
  order: number;
  generationNo: number;
}

/** `POST`/`PUT /api/admin/setting/staffs` 요청 본문. `order` 는 서버가 매기므로 보내지 않는다. */
export interface StaffPayload {
  userId: number | null;
  name: string;
  staffRole: string;
  section: StaffSection;
  department: string;
  introduction: string;
  fileId: number | null;
  generationNo: number;
}

/**
 * `GET /api/public/staffs` 응답. 운영진 소개 페이지(`LeadersPage`) 전용 — 로그인이
 * 필요 없고, 어드민 `Staff`에 있는 `userId`/`generationNo` 같은 관리용 필드가 없다.
 *
 * `profileImageUrl`은 생성된 스키마에 `| null`이 안 잡혀 있다(springdoc이 Java 필드의
 * null 가능성을 그대로 못 옮김) — 사진 없는 운영진은 실제로 `null`이라 손으로 되돌린다.
 */
export type PublicStaff = Omit<Required<components["schemas"]["PublicStaffResult"]>, "profileImageUrl"> & {
  profileImageUrl: string | null;
};

export interface StaffSectionGroup {
  section: StaffSection;
  sectionName: string;
  staffs: PublicStaff[];
}

export interface StaffDirectory {
  sections: StaffSectionGroup[];
}

/**
 * 기능 토글.
 *
 * **`key` 는 BE 가 정한다.** 화면은 받은 목록을 그대로 그린다 — FE 에 키 목록을 두면
 * BE 가 기능을 추가해도 화면에 나오지 않는다. 아직 실제 엔드포인트가 없어 목으로 남긴다.
 */
export interface FeatureToggle {
  key: string;
  label: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
}
