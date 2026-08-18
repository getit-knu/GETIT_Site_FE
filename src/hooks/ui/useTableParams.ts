import { useCallback } from "react";
import { useSearchParams } from "react-router";

import { parseIntParam } from "../../libs/urlParams";

/**
 * 표의 페이지와 필터를 URL 에 둔다.
 *
 * 모달과 같은 이유다 — 새로고침해도 보던 페이지가 유지되고, 링크로 공유된다.
 * `useModalParams` 와 같은 쿼리를 공유하므로 서로의 파라미터를 지우지 않는다.
 *
 * 도메인을 모른다. 필터 값 목록만 받아 그 안에 드는지 확인한다.
 *
 * ```ts
 * const { page, filter, setPage, setFilter } =
 *   useTableParams("status", ["PENDING", "ANSWERED"] as const);
 * ```
 */
/**
 * ⚠️ **`useModalParams` 의 setter 와 한 이벤트 핸들러에서 같이 부르면 안 된다.**
 *
 * ```ts
 * openModal("answer", 7);
 * setPage(2);            // ← 앞의 openModal 이 사라지고 ?page=2 만 남는다
 * ```
 *
 * react-router 의 `setSearchParams` 는 함수 형태로 불러도 인자로 *렌더 시점*의 쿼리를
 * 넘긴다(`nextInit(new URLSearchParams(searchParams))`). 한 핸들러 안의 두 호출이
 * 같은 값에서 출발하므로 뒤엣것이 앞엣것을 덮는다.
 *
 * 둘을 함께 바꿔야 하면 `useSearchParams` 로 한 번에 처리한다.
 *
 * ```ts
 * setSearchParams((prev) => {
 *   const next = new URLSearchParams(prev);
 *   next.set("modal", "answer");
 *   next.set("page", "2");
 *   return next;
 * });
 * ```
 */
export function useTableParams<T extends string>(filterKey: string, allowed: readonly T[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  // 페이지는 0 부터다(명세서 0.3). 형태가 어긋나면 첫 페이지로 본다.
  // Number() 를 그대로 쓰면 ?page=0x10 이 16 페이지로 통한다 — #37 리뷰와 같은 문제.
  const page = parseIntParam(searchParams.get("page"), 0) ?? 0;

  const raw = searchParams.get(filterKey);
  // 주소를 손으로 고쳐 넣은 값이 그대로 서버 조회 조건이 되면 안 된다.
  const filter = allowed.find((value) => value === raw);

  const setPage = useCallback(
    (next: number) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (next <= 0) params.delete("page");
        else params.set("page", String(next));
        return params;
      });
    },
    [setSearchParams],
  );

  const setFilter = useCallback(
    (next: T | undefined) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (next === undefined) params.delete(filterKey);
        else params.set(filterKey, next);
        // 필터를 바꾸면 결과 수가 달라진다. 3페이지에 있다가 필터를 좁히면
        // 있지도 않은 페이지를 요청하게 되므로 첫 페이지로 되돌린다.
        params.delete("page");
        return params;
      });
    },
    [filterKey, setSearchParams],
  );

  return { page, filter, setPage, setFilter };
}
