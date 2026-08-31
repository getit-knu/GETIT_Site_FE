import type { components } from "../../apis/generated";

/**
 * `GET /api/public/activity-photos` 응답(BE#146). 홈 "GETIT과 함께한 순간들" 마퀴가 쓴다.
 * 노출(`isVisible`)로 설정된 사진만 순서대로 온다 — 이 목록엔 그 필드 자체가 없다.
 */
export type PublicActivityPhoto = Required<components["schemas"]["ActivityPhotoPublicResult"]>;

/**
 * `GET /api/public/faqs` 응답(2.5, #212). 비공개(`isVisible: false`) 처리한 FAQ는
 * 서버가 걸러서 안 준다 — 이 목록엔 그런 필드 자체가 없다.
 */
export type PublicFaq = Required<components["schemas"]["FaqPublicResult"]>;

/**
 * `GET /api/public/home` 응답(2.1, #218). Home 화면의 커리큘럼 타임라인 · 프로젝트
 * 쇼케이스 미리보기가 이 안의 `curriculums`·`featuredProjects`를 쓴다.
 *
 * `generation`·`recruitment`·`faqs`·`features`도 이 응답에 들어 있지만, 각각
 * `GET /api/public/recruitment/status`(D-Day 배지)·`GET /api/public/faqs`(#212)로
 * 이미 따로 연동돼 있어 여기서는 안 쓴다. `features`(스톡게임 등 기능 토글)는
 * 아직 이 화면에서 쓸 자리가 없어 타입만 잡아 둔다.
 */
export interface HomeResult {
  curriculums: HomeCurriculum[];
  featuredProjects: HomeFeaturedProject[];
  features: HomeFeatures;
}

/**
 * 커리큘럼 타임라인 항목. **학기(1학기/2학기) 구분이 없는 평평한 목록이다**(BE 확인함,
 * 어드민 커리큘럼 관리(#194)와 같은 한계) — `order`만으로 순서를 매긴다. 옛 목업은
 * 학기별로 묶어 보여줬지만 그 구조를 BE가 주지 않아, 화면을 `order` 하나로 이어지는
 * 단일 타임라인으로 다시 그렸다.
 */
export type HomeCurriculum = Required<components["schemas"]["HomeResultCurriculumInfo"]>;

/**
 * Home 프로젝트 쇼케이스 미리보기 항목. 어드민에서 `isFeatured`로 표시한 프로젝트만
 * 온다(#222) — 팀 이름·기술 스택 등은 이 미리보기엔 없다(전체 목록 `/projects`,
 * #219에만 있음).
 *
 * `thumbnailUrl`은 썸네일 미등록 프로젝트에서 `null`이 온다(다른 프로젝트 응답과
 * 같은 springdoc 함정) — 손으로 되돌린다.
 */
export type HomeFeaturedProject = Omit<
  Required<components["schemas"]["HomeResultFeaturedProjectInfo"]>,
  "thumbnailUrl"
> & { thumbnailUrl: string | null };

/** 기능 토글(#221) 공개 반영분. 아직 이 화면에서 게이팅에 쓰진 않는다. */
export type HomeFeatures = Required<components["schemas"]["HomeResultFeaturesInfo"]>;
