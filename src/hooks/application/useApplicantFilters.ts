import { useCallback } from "react";
import { useSearchParams } from "react-router";

import { parseIntParam } from "../../libs/urlParams";
import { APPLICATION_STATUSES, type ApplicationStatus } from "../../types/application";

/**
 * 지원자 목록의 필터와 페이지를 **전부 URL 에 둔다.**
 *
 * 상태만 URL 에 두고 나머지를 `useState` 로 들면, 새로고침하거나 링크를 공유했을 때
 * 걸어 둔 조건이 사라진다. 운영진이 "이 조건으로 보라" 고 링크를 주고받는 화면이다.
 *
 * **`evaluated`·`keyword` 필터는 없다.** 실제 API(`getApplicants(generationId, status,
 * pageable)`)가 지원하지 않는다(BE 확인함) — 이름 검색·평가 여부 필터는 지금 화면 범위 밖이다.
 */
export function useApplicantFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get("status");
  const status = APPLICATION_STATUSES.find((s) => s === rawStatus);

  const page = parseIntParam(searchParams.get("page"), 0) ?? 0;

  const update = useCallback(
    (next: { status?: ApplicationStatus; page?: number }) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);

        for (const [key, value] of Object.entries(next)) {
          // 기본값은 주소에 남기지 않는다. 공유한 링크가 지저분해진다.
          const isDefault = value === undefined || value === 0;
          if (isDefault) params.delete(key);
          else params.set(key, String(value));
        }

        // 조건을 바꾸면 결과 수가 달라진다. 3페이지에 있다가 좁히면
        // 있지도 않은 페이지를 요청하게 되므로 첫 페이지로 되돌린다.
        if (next.page === undefined && next.status !== undefined) params.delete("page");

        return params;
      });
    },
    [setSearchParams],
  );

  return { status, page, update };
}
