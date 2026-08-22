import type { ApplicantListParams } from "../types/application";
import type { LectureListParams } from "../types/lecture";
import type { QuestionListParams } from "../types/qna";
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
    // 필터가 바뀌면 navigation 도 달라진다. 키에 함께 넣어 캐시가 섞이지 않게 한다.
    detail: (id: number, params: ApplicantListParams) => [...queryKeys.applications.details(), id, params] as const,
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
  },

  /** 사이트 설정은 섹션이 한 덩어리로 오간다(10.20). 키를 쪼개지 않는다. */
  site: {
    all: ["site"] as const,
    settings: () => [...queryKeys.site.all, "settings"] as const,
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
} as const;
