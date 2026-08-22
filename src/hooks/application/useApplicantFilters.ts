import { useCallback } from "react";
import { useSearchParams } from "react-router";

import { parseIntParam } from "../../libs/urlParams";
import { APPLICATION_STATUSES, type ApplicationStatus } from "../../types/application";

/** 평가 여부는 3상태다. `undefined`(전체)를 select 값으로 표현할 수 없어 문자열로 다룬다. */
export const EVALUATED_CHOICES = ["all", "done", "todo"] as const;

export type EvaluatedChoice = (typeof EVALUATED_CHOICES)[number];

const EVALUATED_VALUE: Record<EvaluatedChoice, boolean | undefined> = {
  all: undefined,
  done: true,
  todo: false,
};

/**
 * 지원자 목록의 필터와 페이지를 **전부 URL 에 둔다.**
 *
 * 상태만 URL 에 두고 나머지를 `useState` 로 들면, 새로고침하거나 링크를 공유했을 때
 * 걸어 둔 조건이 사라진다. 운영진이 "이 조건으로 보라" 고 링크를 주고받는 화면이다.
 *
 * **세터를 하나로 모은 이유가 있다.** 훅을 나눠 각자 `setSearchParams` 를 부르면
 * 한 이벤트 핸들러에서 둘을 호출할 때 뒤엣것이 앞엣것을 덮는다(#44 참고).
 */
export function useApplicantFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get("status");
  const status = APPLICATION_STATUSES.find((s) => s === rawStatus);

  const rawEvaluated = searchParams.get("evaluated");
  // 허용 목록으로 좁힌다. 이 필드만 놓고 보면 잘못된 값도 결국 undefined 로 떨어지지만,
  // 선택지가 늘어나 매핑에 없는 값이 생기면 그때부터는 조용히 새는 조건이 된다.
  const evaluatedChoice = EVALUATED_CHOICES.find((c) => c === rawEvaluated) ?? "all";

  const keyword = searchParams.get("keyword") ?? "";
  const page = parseIntParam(searchParams.get("page"), 0) ?? 0;

  const update = useCallback(
    (next: { status?: ApplicationStatus; evaluated?: EvaluatedChoice; keyword?: string; page?: number }) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);

          for (const [key, value] of Object.entries(next)) {
            // 기본값은 주소에 남기지 않는다. 공유한 링크가 지저분해진다.
            const isDefault = value === undefined || value === "" || value === "all" || value === 0;
            if (isDefault) params.delete(key);
            else params.set(key, String(value));
          }

          // 조건을 바꾸면 결과 수가 달라진다. 3페이지에 있다가 좁히면
          // 있지도 않은 페이지를 요청하게 되므로 첫 페이지로 되돌린다.
          if (next.page === undefined) params.delete("page");

          return params;
        },
        // 검색어는 글자마다 기록을 남기면 뒤로가기가 쓸모없어진다.
        { replace: next.keyword !== undefined },
      );
    },
    [setSearchParams],
  );

  return {
    status,
    evaluatedChoice,
    evaluated: EVALUATED_VALUE[evaluatedChoice],
    keyword,
    page,
    update,
  };
}
