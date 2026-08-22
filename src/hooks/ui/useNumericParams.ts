import { useCallback } from "react";
import { useSearchParams } from "react-router";

import { parseIntParam } from "../../libs/urlParams";

/**
 * 숫자 id 를 쿼리에 두고 읽는다. 트랙·소분류처럼 **값 목록이 서버에서 오는 필터**에 쓴다.
 *
 * `useTableParams` 는 허용 값을 문자열 목록으로 미리 알아야 해서 여기엔 맞지 않는다.
 *
 * ⚠️ `useModalParams` 나 `useTableParams` 의 setter 와 한 이벤트 핸들러에서 같이 부르면
 * 뒤엣것이 앞엣것을 덮는다(#44 참고). 이 화면은 이 훅만 쓴다.
 */
export function useNumericParams(keys: readonly string[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  // 손으로 고친 주소가 그대로 조회 조건이 되면 안 된다. 양의 정수만 받는다.
  const values = Object.fromEntries(
    keys.map((key) => [key, parseIntParam(searchParams.get(key), 1) ?? undefined]),
  ) as Record<string, number | undefined>;

  /** 여러 값을 한 번에 바꾼다. `undefined` 를 주면 그 키를 지운다. */
  const setValues = useCallback(
    (next: Record<string, number | undefined>) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(next)) {
          if (value === undefined) params.delete(key);
          else params.set(key, String(value));
        }
        return params;
      });
    },
    [setSearchParams],
  );

  return { values, setValues };
}
