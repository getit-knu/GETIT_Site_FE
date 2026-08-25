import type { ComponentType } from "react";
import { createBrowserRouter, Outlet, ScrollRestoration, type RouteObject } from "react-router";

import { RequireRole } from "./components/auth/RequireRole";

/**
 * 페이지를 지연 로딩한다.
 *
 * `React.lazy` 대신 라우트의 `lazy` 를 쓴다. 라우터가 전환 중에 이전 화면을 유지해 주므로
 * 페이지마다 `<Suspense>` 로 감쌀 필요가 없고, 깜빡임도 생기지 않는다.
 *
 * 어드민은 화면이 17개다. 통째로 묶으면 공개 사이트만 보러 온 방문자도 그 코드를 전부 받는다.
 */
function page(load: () => Promise<{ default: ComponentType }>): RouteObject["lazy"] {
  return { Component: () => load().then((m) => m.default) };
}

/**
 * 이름 있는 export 를 지연 로딩한다. 레이아웃처럼 default export 가 아닌 것에 쓴다.
 *
 * **레이아웃도 지연 로딩해야 한다.** 정적으로 import 하면 사이드바 메뉴·아이콘·문구가
 * 메인 번들에 들어가, 로그인도 하지 않은 방문자가 어드민 화면 구성을 통째로 내려받는다.
 */
function layout(load: () => Promise<Record<string, ComponentType>>, name: string): RouteObject["lazy"] {
  return { Component: () => load().then((m) => m[name]) };
}

/**
 * 공개 · 부원 · 어드민 3영역.
 *
 * 권한 검사는 각 영역의 부모 라우트에서 `RequireRole` 로 **한 번만** 한다.
 * 페이지마다 걸면 새 페이지를 추가할 때 빠뜨리기 쉽고, 빠뜨려도 티가 나지 않는다.
 */
const areaRoutes: RouteObject[] = [
  // ── 공개 ────────────────────────────────────────────────
  // 콜백·403은 Nav/Footer가 필요 없는 화면이라 PublicLayout 밖에 둔다.
  {
    lazy: layout(() => import("./components/layout/PublicLayout"), "PublicLayout"),
    children: [
      { path: "/", lazy: page(() => import("./pages/HomePage")) },
      { path: "/projects", lazy: page(() => import("./pages/ProjectsPage")) },
    ],
  },
  { path: "/oauth/callback", lazy: page(() => import("./pages/OAuthCallbackPage")) },
  { path: "/403", lazy: page(() => import("./pages/ForbiddenPage")) },

  // ── 부원 ────────────────────────────────────────────────
  // 운영진도 부원 화면을 볼 수 있어야 한다.
  {
    path: "/member",
    element: <RequireRole allowed={["MEMBER", "ADMIN"]} />,
    children: [{ index: true, lazy: page(() => import("./pages/member/MemberHomePage")) }],
  },

  // ── 어드민 ──────────────────────────────────────────────
  // RequireRole 이 AdminLayout 을 감싼다. 순서가 반대면 권한이 없는 사용자에게도
  // 셸이 한 번 그려졌다가 사라진다.
  {
    path: "/admin",
    element: <RequireRole allowed={["ADMIN"]} />,
    children: [
      {
        lazy: layout(() => import("./components/admin/AdminLayout"), "AdminLayout"),
        children: [
          { index: true, lazy: page(() => import("./pages/admin/AdminHomePage")) },
          { path: "applications", lazy: page(() => import("./pages/admin/ApplicationsPage")) },
          { path: "lectures", lazy: page(() => import("./pages/admin/LecturesPage")) },
          { path: "users", lazy: page(() => import("./pages/admin/UsersPage")) },
          { path: "site", lazy: page(() => import("./pages/admin/SitePage")) },
          { path: "questions", lazy: page(() => import("./pages/admin/QuestionsPage")) },
          { path: "settings", lazy: page(() => import("./pages/admin/SettingsPage")) },
        ],
      },
    ],
  },

  { path: "*", lazy: page(() => import("./pages/NotFoundPage")) },
];

/**
 * 경로가 없는 루트 라우트로 전체를 감싼다.
 *
 * 첫 진입 때는 해당 페이지 청크를 아직 받는 중이라 그릴 것이 없다.
 * `HydrateFallback` 을 주지 않으면 라우터가 그 틈에 무엇을 그릴지 몰라 경고를 낸다.
 *
 * `createBrowserRouter`는 페이지 전환 시 스크롤 위치를 알아서 맨 위로 돌려주지 않는다 —
 * `<ScrollRestoration />`을 라우터 트리 안에 직접 그려야 동작한다(react-router 데이터
 * 라우터 API의 opt-in 기능). 그래서 여기서는 `element` 를 비워 두는 대신 `Outlet`과
 * 나란히 그린다.
 */
const routes: RouteObject[] = [
  {
    // TODO(A-3): 전체 화면 로딩 컴포넌트로 교체한다.
    HydrateFallback: () => null,
    Component: () => (
      <>
        <ScrollRestoration />
        <Outlet />
      </>
    ),
    children: areaRoutes,
  },
];

export const router = createBrowserRouter(routes);
