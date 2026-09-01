import type { ComponentType } from "react";
import { createBrowserRouter, type RouteObject } from "react-router";

import { RequireRole } from "./components/auth/RequireRole";
import { Root } from "./components/layout/Root";
import { FullScreenLoader } from "./components/ui/FullScreenLoader/FullScreenLoader";
import { formatTitle, HOME_TITLE } from "./libs/documentTitle";
import { ROLES } from "./types/auth";

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
/*
  같은 이름의 화면이 영역마다 있어서 붙이는 꼬리표다 — 부원 대시보드와 어드민 대시보드가
  둘 다 "대시보드" 라, 탭을 둘 다 열어 두면 어느 쪽인지 알 수 없다. 공개 화면은 겹치는
  이름이 없고 방문자가 "영역" 이라는 개념을 알 필요도 없어 붙이지 않는다.
*/
const MEMBER = "부원";
const ADMIN = "관리자";

const areaRoutes: RouteObject[] = [
  // ── 공개 ────────────────────────────────────────────────
  // 콜백·403은 Nav/Footer가 필요 없는 화면이라 PublicLayout 밖에 둔다.
  {
    lazy: layout(() => import("./components/layout/PublicLayout"), "PublicLayout"),
    children: [
      { path: "/", handle: { title: HOME_TITLE }, lazy: page(() => import("./pages/HomePage")) },
      {
        path: "/projects",
        handle: { title: formatTitle("프로젝트 쇼케이스") },
        lazy: page(() => import("./pages/ProjectsPage")),
      },
      { path: "/apply", handle: { title: formatTitle("지원하기") }, lazy: page(() => import("./pages/ApplyPage")) },
      {
        path: "/leaders",
        handle: { title: formatTitle("운영진 소개") },
        lazy: page(() => import("./pages/LeadersPage")),
      },
      { path: "/login", handle: { title: formatTitle("로그인") }, lazy: page(() => import("./pages/LoginPage")) },
    ],
  },
  {
    path: "/oauth/callback",
    handle: { title: formatTitle("로그인 중") },
    lazy: page(() => import("./pages/OAuthCallbackPage")),
  },
  {
    path: "/403",
    handle: { title: formatTitle("접근 권한이 없습니다") },
    lazy: page(() => import("./pages/ForbiddenPage")),
  },

  // 신규 유저 온보딩(개인정보 동의). `/me`와 같은 이유로 role 무관하게 통과시킨다 —
  // GUEST도(승격 전 첫 로그인이라) 여기부터 거쳐야 한다. Nav·Footer가 필요 없는
  // 화면이라 `/oauth/callback`처럼 PublicLayout 밖에 둔다.
  {
    path: "/onboarding",
    element: <RequireRole allowed={ROLES} />,
    children: [
      { index: true, handle: { title: formatTitle("환영합니다") }, lazy: page(() => import("./pages/OnboardingPage")) },
    ],
  },

  // 내 정보(#240). GUEST·MEMBER·ADMIN 전부 접근 가능해야 해서 `/member`·`/admin`
  // 밖에 둔다 — 로그인만 돼 있으면 role 무관하게 통과(`RequireRole allowed={ROLES}`).
  // 공개 Nav·MemberLayout·AdminLayout Topbar가 각자 이 경로로 진입 링크를 건다.
  {
    path: "/me",
    element: <RequireRole allowed={ROLES} />,
    children: [
      {
        lazy: layout(() => import("./components/layout/PublicLayout"), "PublicLayout"),
        children: [
          { index: true, handle: { title: formatTitle("내 정보") }, lazy: page(() => import("./pages/MyPage")) },
        ],
      },
    ],
  },

  // ── 부원 ────────────────────────────────────────────────
  // 운영진도 부원 화면을 볼 수 있어야 한다. RequireRole 이 MemberLayout 을 감싸는
  // 순서는 어드민과 같은 이유(권한 없는 사용자에게 셸이 스치지 않도록)다.
  {
    path: "/member",
    element: <RequireRole allowed={["MEMBER", "ADMIN"]} />,
    children: [
      {
        lazy: layout(() => import("./components/layout/MemberLayout"), "MemberLayout"),
        children: [
          {
            index: true,
            handle: { title: formatTitle("강좌 목록", MEMBER) },
            lazy: page(() => import("./pages/member/LectureListPage")),
          },
          {
            path: "lectures/:id",
            handle: { title: formatTitle("강의", MEMBER) },
            lazy: page(() => import("./pages/member/LectureDetailPage")),
          },
          {
            path: "dashboard",
            handle: { title: formatTitle("대시보드", MEMBER) },
            lazy: page(() => import("./pages/member/DashboardPage")),
          },
          {
            path: "group",
            handle: { title: formatTitle("내 그룹", MEMBER) },
            lazy: page(() => import("./pages/member/GroupPage")),
          },
        ],
      },
    ],
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
          {
            index: true,
            handle: { title: formatTitle("대시보드", ADMIN) },
            lazy: page(() => import("./pages/admin/AdminHomePage")),
          },
          {
            path: "applications",
            handle: { title: formatTitle("지원서 관리", ADMIN) },
            lazy: page(() => import("./pages/admin/ApplicationsPage")),
          },
          {
            path: "lectures",
            handle: { title: formatTitle("강의 관리", ADMIN) },
            lazy: page(() => import("./pages/admin/LecturesPage")),
          },
          {
            path: "projects",
            handle: { title: formatTitle("프로젝트 관리", ADMIN) },
            lazy: page(() => import("./pages/admin/ProjectsPage")),
          },
          {
            path: "users",
            handle: { title: formatTitle("사용자 관리", ADMIN) },
            lazy: page(() => import("./pages/admin/UsersPage")),
          },
          {
            path: "site",
            handle: { title: formatTitle("사이트 관리", ADMIN) },
            lazy: page(() => import("./pages/admin/SitePage")),
          },
          {
            path: "questions",
            handle: { title: formatTitle("Q&A 관리", ADMIN) },
            lazy: page(() => import("./pages/admin/QuestionsPage")),
          },
          {
            path: "settings",
            handle: { title: formatTitle("설정", ADMIN) },
            lazy: page(() => import("./pages/admin/SettingsPage")),
          },
        ],
      },
    ],
  },

  {
    path: "*",
    handle: { title: formatTitle("페이지를 찾을 수 없습니다") },
    lazy: page(() => import("./pages/NotFoundPage")),
  },
];

/**
 * 경로가 없는 루트 라우트로 전체를 감싼다.
 *
 * 첫 진입 때는 해당 페이지 청크를 아직 받는 중이라 그릴 것이 없다.
 * `HydrateFallback` 을 주지 않으면 라우터가 그 틈에 무엇을 그릴지 몰라 경고를 낸다.
 */
const routes: RouteObject[] = [
  {
    // 첫 진입 청크를 받는 동안 보이는 화면. `null`이면 그동안 흰 화면만 남는다.
    HydrateFallback: () => <FullScreenLoader label="GET IT을 여는 중이에요" />,
    Component: Root,
    children: areaRoutes,
  },
];

export const router = createBrowserRouter(routes);
