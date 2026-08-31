import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMe, updateMe } from "../../apis/auth/authApi";
import { queryKeys } from "../../apis/queryKeys";
import type { Me, MeUpdatePayload, Role } from "../../types/auth";

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
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: getMe,

    // 401 을 재시도해도 결과는 같다. queryClient 의 기본 retry 가 이미 걸러내지만
    // 세션은 첫 화면을 막고 있어 한 번이라도 헛도는 걸 피한다.
    retry: false,

    // 권한이 바뀌는 일은 드물다. 화면을 옮길 때마다 다시 물을 이유가 없다.
    staleTime: 5 * 60_000,
  });

  // **`data` 만 보면 안 된다.** TanStack Query 는 재조회가 실패해도 직전에 성공한 `data` 를
  // 그대로 남겨 둔다. 세션이 만료돼 `/api/auth/me` 가 401 을 주는데도 이전 사용자 정보가
  // 남아 있어, 로그아웃된 사람에게 계속 어드민 화면이 열린다.
  //
  // 마지막 조회가 실패했으면 들고 있는 값이 무엇이든 로그인으로 보지 않는다.
  const isAuthenticated = data !== undefined && !isError;

  return {
    // 인증이 풀린 상태에서 이름·권한만 남아 화면에 그려지지 않도록 함께 비운다.
    user: isAuthenticated ? data : undefined,
    isLoading: isPending,
    isAuthenticated,
  };
}

/** 사용자가 주어진 권한 중 하나라도 가지고 있는지. */
export function hasRole(user: Me | undefined, allowed: readonly Role[]): boolean {
  return user !== undefined && allowed.includes(user.role);
}

/** 본인 프로필 수정(#147). 세 role 모두 쓴다 — role별로 다른 훅을 두지 않는다. */
export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MeUpdatePayload) => updateMe(payload),
    onSuccess: (me) => {
      queryClient.setQueryData(queryKeys.auth.me(), me);
    },
  });
}
