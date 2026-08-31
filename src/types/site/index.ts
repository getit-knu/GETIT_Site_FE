import type { components } from "../../apis/generated";

/**
 * 사이트 설정 타입.
 *
 * **`generated.ts`에서 재노출한다.** `domain/setting/*` DTO는 애초에 도메인 접두어가 붙은
 * 고유한 이름(`GenerationResult`, `CurriculumResult` 등)이라 스키마 이름 충돌 버그
 * (`getit-knu/GETIT_Site_BE#137`, `types/lecture/index.ts` 상단 주석 참고)의 영향을
 * 받은 적이 없었다 — 예전엔 다른 도메인(강의 등)에서 실제로 충돌을 겪은 뒤라 이 파일도
 * 안전하게 손타입으로 옮겨 뒀던 것인데, 다시 확인해 보니 애초에 그럴 필요가 없었다.
 *
 * **모집 일정은 이 파일에 없다** — `Generation` 엔티티엔 시작·종료일 필드가 아예 없고
 * (BE 확인함), 실제 모집 일정은 별개 도메인인 `types/recruitment`의
 * `RecruitmentSchedule`/`SchedulePayload`다. 예전엔 사이트 관리 전용 목 데이터
 * (`SiteSchedule`)로 따로 있었는데, 모집 관리 화면의 진짜 일정과 서로 안 맞는 문제가 있어
 * 사이트 관리도 그 도메인을 그대로 쓰도록 합쳤다.
 *
 * **FAQ(#212)·기능 토글(#221)은 실제 연동됨.**
 */

/** 진행 기수. 활성 기수는 하나뿐이다 — `PUT` 으로 새 기수를 활성화하면 기존 기수는 내려간다. */
export type Generation = Required<components["schemas"]["GenerationResult"]>;

/** `PUT /api/admin/setting/generation` 요청 본문. 시작·종료일은 없다 — 그건 모집 일정(별개 도메인)의 값이다. */
export type GenerationPayload = components["schemas"]["GenerationUpdateRequest"];

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
export type Curriculum = Required<components["schemas"]["CurriculumResult"]>;

/** `POST`/`PUT /api/admin/setting/curriculums` 요청 본문. */
export type CurriculumPayload = components["schemas"]["CurriculumRequest"];

/**
 * 행사 종류.
 *
 * **`types/dashboard` 에도 `EventType` 이 있다**(값은 지금 같지만, 이름이 부딪히므로
 * 도메인 접두어를 붙인다 — 두 도메인이 같은 스키마를 공유하는 건 아니라 값이 각자
 * 바뀔 수 있다).
 */
export type SiteEventType = NonNullable<components["schemas"]["EventResult"]["type"]>;

/** 행사 일정. `isVisible` 이 꺼진 행사는 공개 캘린더(`GET /api/public/events`)에 안 뜬다. */
export type SiteEvent = Required<components["schemas"]["EventResult"]>;

/** `POST`/`PUT /api/admin/setting/events` 요청 본문. */
export type SiteEventPayload = components["schemas"]["EventRequest"];

/**
 * `GET /api/public/events?year=&month=` 응답(#220). Home "GETIT 활동 일정" 캘린더가 쓴다.
 * `isVisible`이 꺼진 행사는 서버가 걸러서 안 준다 — 이 목록엔 그런 필드 자체가 없다.
 */
export type PublicEvent = Required<components["schemas"]["EventCalendarResultItem"]>;

/** `Required<>`는 배열 원소 내부까지 못 채우므로 `PublicEvent`로 직접 합성한다. */
export interface PublicEventCalendar {
  year: number;
  month: number;
  events: PublicEvent[];
}

/**
 * FAQ (10.18 · 10.19). `Curriculum`과 달리 기수 스코프가 없다(BE 확인함 — 요청·응답에
 * generationId 없음) — 기수가 바뀌어도 유지되는 상시 문답이라 그렇다.
 */
export type Faq = Required<components["schemas"]["FaqResult"]>;

/**
 * `POST`/`PUT /api/admin/setting/faqs` 요청 본문. `order`는 커리큘럼과 같은 방식(BE
 * 소스로 확인함) — 생성 시 생략하면 맨 뒤에 붙고, 수정 시 생략하면 순서를 유지한다.
 * 값을 보내면 그 자리에 끼워 넣고 나머지를 밀거나 당긴다.
 */
export type FaqPayload = components["schemas"]["FaqRequest"];

/** 운영진 구역. 순서는 **구역 안에서만** 다시 매긴다(`PUT .../staffs/order`). */
export type StaffSection = NonNullable<components["schemas"]["StaffRequest"]["section"]>;

/**
 * 운영진 프로필. 개별 엔드포인트로 즉시 반영된다.
 *
 * `userId`(실제 계정 연결 — 없으면 표시 전용 프로필)·`profileImageUrl`·`githubUrl`·
 * `instagramUrl`은 생성된 스키마에 `| null`이 안 잡혀 있다(springdoc 함정) — 손으로
 * 되돌린다. SNS 링크 둘 다 계정이 없는 운영진도 있어 실제로 `null`이 온다(BE 확인함).
 */
export type Staff = Omit<
  Required<components["schemas"]["StaffResult"]>,
  "userId" | "profileImageUrl" | "githubUrl" | "instagramUrl"
> & {
  userId: number | null;
  profileImageUrl: string | null;
  githubUrl: string | null;
  instagramUrl: string | null;
};

/**
 * `POST`/`PUT /api/admin/setting/staffs` 요청 본문. `order` 는 서버가 매기므로 보내지 않는다.
 *
 * `userId`(실제 계정 연결)·`fileId`(새로 올린 프로필 사진)·`githubUrl`·`instagramUrl`(SNS
 * 링크)는 스키마엔 optional이지만 "값 없음"을 명시적으로 보내야 해서 `null`을 허용하도록
 * 손으로 되돌린다. BE `@HttpUrl` 검증(http/https만 허용, null은 통과)은 값이 있을 때만 적용.
 */
export type StaffPayload = Omit<
  Required<components["schemas"]["StaffRequest"]>,
  "userId" | "fileId" | "githubUrl" | "instagramUrl"
> & {
  userId: number | null;
  fileId: number | null;
  githubUrl: string | null;
  instagramUrl: string | null;
};

/**
 * `GET /api/public/staffs` 응답. 운영진 소개 페이지(`LeadersPage`) 전용 — 로그인이
 * 필요 없고, 어드민 `Staff`에 있는 `userId`/`generationNo` 같은 관리용 필드가 없다.
 *
 * `profileImageUrl`·`githubUrl`·`instagramUrl`은 생성된 스키마에 `| null`이 안 잡혀
 * 있다(springdoc이 Java 필드의 null 가능성을 그대로 못 옮김) — 손으로 되돌린다.
 */
export type PublicStaff = Omit<
  Required<components["schemas"]["PublicStaffResult"]>,
  "profileImageUrl" | "githubUrl" | "instagramUrl"
> & {
  profileImageUrl: string | null;
  githubUrl: string | null;
  instagramUrl: string | null;
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
 * 기능 토글(#221). `GET`/`PUT /api/admin/setting/features(/{key})`.
 *
 * **`key` 는 BE 가 정한다.** 화면은 받은 목록을 그대로 그린다 — FE 에 키 목록을 두면
 * BE 가 기능을 추가해도 화면에 나오지 않는다(다만 스키마 자체는 현재
 * `"STOCK_GAME" | "MOCK_INVESTMENT"`로 좁혀져 있음).
 *
 * `updatedAt`·`updatedBy`는 한 번도 토글한 적 없는 기능이면 실제로 `null`이 온다
 * (BE 소스 확인함, `FeatureToggleAdminService`가 갱신 전엔 시드값 그대로 둠) — 손으로
 * 되돌린다.
 */
export type FeatureToggle = Omit<Required<components["schemas"]["FeatureResult"]>, "updatedAt" | "updatedBy"> & {
  updatedAt: string | null;
  updatedBy: string | null;
};

/** `PUT /api/admin/setting/features/{key}` 요청 본문. */
export type FeatureTogglePayload = components["schemas"]["FeatureToggleRequest"];
