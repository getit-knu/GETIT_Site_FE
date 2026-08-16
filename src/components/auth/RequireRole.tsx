import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

import { hasRole, useSession } from "../../hooks/auth/useSession";
import type { Role } from "../../types/auth";

interface RequireRoleProps {
  /** 이 중 하나라도 가지고 있으면 통과한다. */
  allowed: readonly Role[];
  /** 자식을 직접 넘기지 않으면 `<Outlet />` 을 그린다. */
  children?: ReactNode;
}

/**
 * 권한 가드.
 *
 * **레이아웃 라우트에 한 번만 건다.** 페이지마다 반복하면 같은 검사가 중복되고,
 * 새 페이지를 추가할 때 가드를 빠뜨리면 그 페이지만 조용히 뚫린다.
 *
 * ```tsx
 * { element: <RequireRole allowed={["ADMIN"]} />, children: [ ...어드민 라우트 ] }
 * ```
 *
 * 세션을 아직 모르는 동안(`isLoading`)에 리다이렉트하면 새로고침할 때마다
 * 로그인 화면이 한 번 스쳤다가 돌아온다. 판정이 끝날 때까지 기다린다.
 */
export function RequireRole({ allowed, children }: RequireRoleProps) {
  const { user, isLoading, isAuthenticated } = useSession();
  const location = useLocation();

  if (isLoading) {
    // TODO(A-3): 전체 화면 로딩 컴포넌트로 교체한다.
    return null;
  }

  if (!isAuthenticated) {
    // 로그인 후 원래 가려던 곳으로 돌려보내기 위해 경로를 넘긴다.
    return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
  }

  if (!hasRole(user, allowed)) {
    return <Navigate to="/403" replace />;
  }

  return children ?? <Outlet />;
}
