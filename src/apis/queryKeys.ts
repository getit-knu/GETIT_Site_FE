import type { ApplicantListParams } from "../types/application";
import type { LectureListParams, SubmissionListParams } from "../types/lecture";
import type { QuestionListParams } from "../types/qna";
import type { AdminProjectListParams, PublicProjectListParams } from "../types/project";
import type { UserListParams } from "../types/user";

/**
 * 쿼리 키 팩토리.
 *
 * 키를 문자열로 흩뿌리면 무효화할 때 어디를 지워야 하는지 알 수 없다.
 * 도메인마다 팩토리 객체를 하나 두고 키를 여기서만 만든다.
 *
 * ## 규약
 *
 * 1. `all` 은 도메인 전체를 가리키는 루트다. 도메인을 통째로 무효화할 때 쓴다.
 * 2. 하위 키는 반드시 `all` 을 앞에 깔고 확장한다. 그래야 부모를 무효화하면
 *    자식도 함께 무효화된다 (TanStack Query 는 접두사로 매칭한다).
 * 3. 파라미터가 있는 키는 함수로, 없으면 상수로 둔다.
 * 4. `as const` 를 붙여 튜플 타입을 고정한다. 붙이지 않으면 `string[]` 이 되어
 *    키 구조가 타입으로 드러나지 않는다.
 *
 * ## 예시
 *
 * ```ts
 * // 조회
 * useQuery({ queryKey: queryKeys.questions.detail(id), queryFn: () => getQuestion(id) });
 *
 * // 목록만 무효화 — 상세는 그대로 둔다
 * queryClient.invalidateQueries({ queryKey: queryKeys.questions.lists() });
 *
 * // 도메인 전체 무효화
 * queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
 * ```
 *
 * 새 도메인을 추가할 때 아래 `questions` 를 복사해서 쓰면 된다.
 */
export const queryKeys = {
  applications: {
    all: ["applications"] as const,
    lists: () => [...queryKeys.applications.all, "list"] as const,
    list: (params: ApplicantListParams) => [...queryKeys.applications.lists(), params] as const,
    details: () => [...queryKeys.applications.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.applications.details(), id] as const,
    // 필터가 바뀌면 이전·다음도 달라진다. 키에 함께 넣어 캐시가 섞이지 않게 한다.
    adjacent: (id: number, params: ApplicantListParams) =>
      [...queryKeys.applications.all, "adjacent", id, params] as const,
    scores: (id: number) => [...queryKeys.applications.all, "scores", id] as const,
  },

  /** 로그인한 지원자 본인의 지원서. 어드민 `applications`와는 다른 도메인이다. */
  myApplication: {
    all: ["myApplication"] as const,
    form: () => [...queryKeys.myApplication.all, "form"] as const,
    mine: () => [...queryKeys.myApplication.all, "mine"] as const,
    result: () => [...queryKeys.myApplication.all, "result"] as const,
  },

  /**
   * 대시보드는 카드 5개가 각자 조회한다. 한 곳이 실패해도 나머지는 보여야 하므로
   * 키를 카드 단위로 나눈다.
   */
  dashboard: {
    all: ["dashboard"] as const,
    summary: () => [...queryKeys.dashboard.all, "summary"] as const,
    recentQuestions: () => [...queryKeys.dashboard.all, "recent-questions"] as const,
    submissionStatus: () => [...queryKeys.dashboard.all, "submission-status"] as const,
    upcomingEvents: () => [...queryKeys.dashboard.all, "upcoming-events"] as const,
    ongoingLectures: () => [...queryKeys.dashboard.all, "ongoing-lectures"] as const,
  },

  /** 강의는 탭 구성과 목록이 한 덩어리로 온다. 필터마다 캐시가 갈라진다. */
  lectures: {
    all: ["lectures"] as const,
    board: (params: LectureListParams) => [...queryKeys.lectures.all, "board", params] as const,
    details: () => [...queryKeys.lectures.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.lectures.details(), id] as const,
    submission: (id: number) => [...queryKeys.lectures.all, "submission", id] as const,
    submissions: (params: SubmissionListParams) => [...queryKeys.lectures.all, "submissions", params] as const,
  },

  site: {
    all: ["site"] as const,
    // 모집 일정은 여기 없다 — 모집 관리와 같은 `queryKeys.recruitment.schedule()`을 쓴다.
    // 진행 기수 · 운영진 · 행사 · 커리큘럼 · 강의 분류 · FAQ · 기능 토글은 각자 실제(또는 개별) 엔드포인트라 키를 나눈다.
    generation: () => [...queryKeys.site.all, "generation"] as const,
    staffs: () => [...queryKeys.site.all, "staffs"] as const,
    curriculums: () => [...queryKeys.site.all, "curriculums"] as const,
    events: () => [...queryKeys.site.all, "events"] as const,
    tracks: () => [...queryKeys.site.all, "tracks"] as const,
    faqs: () => [...queryKeys.site.all, "faqs"] as const,
    features: () => [...queryKeys.site.all, "features"] as const,
  },

  /** 어드민 프로젝트 관리(#222). 필터(학기)·페이지마다 캐시가 갈라진다. */
  projects: {
    all: ["projects"] as const,
    board: (params: AdminProjectListParams) => [...queryKeys.projects.all, "board", params] as const,
  },

  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params: UserListParams) => [...queryKeys.users.lists(), params] as const,
  },

  /** 조 편성은 한 덩어리로 온다. 목록·상세를 나눌 이유가 없다. */
  groups: {
    all: ["groups"] as const,
    board: () => [...queryKeys.groups.all, "board"] as const,
  },

  /** 지원 시스템 설정. 세 영역이 각자 조회한다. */
  recruitment: {
    all: ["recruitment"] as const,
    schedule: () => [...queryKeys.recruitment.all, "schedule"] as const,
    questions: () => [...queryKeys.recruitment.all, "questions"] as const,
    criteria: () => [...queryKeys.recruitment.all, "criteria"] as const,
  },

  auth: {
    all: ["auth"] as const,
    /** 로그인한 사용자 본인. 권한 판단의 유일한 출처다. */
    me: () => [...queryKeys.auth.all, "me"] as const,
  },

  /** 부원 본인 관련. 어드민 `dashboard`·`users`와는 다른 도메인이다. */
  member: {
    all: ["member"] as const,
    summary: () => [...queryKeys.member.all, "summary"] as const,
  },

  /**
   * 다른 도메인이 따라야 할 표준 형태.
   * 목록은 필터마다 캐시가 갈라지므로 필터 객체를 키에 포함한다.
   */
  questions: {
    all: ["questions"] as const,
    lists: () => [...queryKeys.questions.all, "list"] as const,
    list: (params: QuestionListParams) => [...queryKeys.questions.lists(), params] as const,
    details: () => [...queryKeys.questions.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.questions.details(), id] as const,
  },

  /** 로그인 없이 공개 라우트에서도 쓴다. 어드민 쪽(`site`/`recruitment`)과는 별개 키다. */
  public: {
    all: ["public"] as const,
    staffs: () => [...queryKeys.public.all, "staffs"] as const,
    colleges: () => [...queryKeys.public.all, "colleges"] as const,
    majors: () => [...queryKeys.public.all, "majors"] as const,
    recruitmentStatus: () => [...queryKeys.public.all, "recruitment-status"] as const,
    faqs: () => [...queryKeys.public.all, "faqs"] as const,
    projects: (params: PublicProjectListParams) => [...queryKeys.public.all, "projects", params] as const,
    home: () => [...queryKeys.public.all, "home"] as const,
    events: (year: number, month: number) => [...queryKeys.public.all, "events", year, month] as const,
  },
} as const;
