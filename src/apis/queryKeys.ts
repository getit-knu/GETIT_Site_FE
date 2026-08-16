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
    list: (filters: QuestionListFilters) => [...queryKeys.questions.lists(), filters] as const,
    details: () => [...queryKeys.questions.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.questions.details(), id] as const,
  },
} as const;

/** 목록 필터. 서버 스키마가 생기면 `generated.ts` 에서 가져온다. */
export interface QuestionListFilters {
  status?: "PENDING" | "ANSWERED";
  page?: number;
}
