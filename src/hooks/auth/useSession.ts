import { useQuery } from "@tanstack/react-query";

import { getMe } from "../../apis/auth/authApi";
import { queryKeys } from "../../apis/queryKeys";
import type { Me, Role } from "../../types/auth";

interface Session {
  user: Me | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * 로그인한 사용자. 권한 판단의 유일한 출처다.
 *
 * 여러 컴포넌트가 동시에 불러도 TanStack Query 가 같은 키로 묶어
 * 요청은 한 번만 나간다. 그래서 굳이 Context 로 감싸지 않았다.
 */
export function useSession(): Session {
  const { data, isPending } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: getMe,

    // 401 을 재시도해도 결과는 같다. queryClient 의 기본 retry 가 이미 걸러내지만
    // 세션은 첫 화면을 막고 있어 한 번이라도 헛도는 걸 피한다.
    retry: false,

    // 권한이 바뀌는 일은 드물다. 화면을 옮길 때마다 다시 물을 이유가 없다.
    staleTime: 5 * 60_000,
  });

  return {
    user: data,
    isLoading: isPending,
    isAuthenticated: data !== undefined,
  };
}

/** 사용자가 주어진 권한 중 하나라도 가지고 있는지. */
export function hasRole(user: Me | undefined, allowed: readonly Role[]): boolean {
  return user !== undefined && allowed.includes(user.role);
}
