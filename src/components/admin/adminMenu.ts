/**
 * 어드민 사이드바 메뉴.
 *
 * **와이어프레임은 페이지마다 사이드바가 다르게 그려져 있다.** p5·6·7·12·13·18·19·20·21·24 는
 * 6개(사이트 관리 · Q&A 관리 없음), p8·14 는 `사용자 관리` 를 `부원 관리` 로 적었다.
 * 여기 8개로 통일하고 표기는 `사용자 관리` 를 쓴다.
 *
 * `title` 은 Topbar 에 그대로 나간다. 와이어프레임은 모든 페이지 타이틀이
 * `운영진 관리 페이지` 로 같지만, 그러면 어디에 있는지 알 수 없어 페이지명을 쓴다.
 *
 * 아이콘은 24×24 뷰박스 기준 stroke path 다. 아이콘 라이브러리를 넣지 않은 이유는
 * 공통 컴포넌트가 `✕` 같은 문자 글리프를 쓰고 있어 아직 프로젝트에 아이콘 전략이 없기 때문이다.
 * lucide 같은 걸 도입하기로 하면 이 `icon` 필드만 걷어내면 된다.
 */
export interface AdminMenuItem {
  path: string;
  label: string;
  title: string;
  icon: string;
  /** 화면이 아직 없는 메뉴. 눌러도 이동하지 않는다. */
  disabled?: boolean;
}

export const ADMIN_MENU: readonly AdminMenuItem[] = [
  {
    path: "/admin",
    label: "대시보드",
    title: "대시보드",
    icon: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  },
  {
    path: "/admin/applications",
    label: "지원서 관리",
    title: "지원서 관리",
    icon: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7",
  },
  {
    path: "/admin/lectures",
    label: "강의 관리",
    title: "강의 관리",
    icon: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM9 8h7",
  },
  {
    path: "/admin/users",
    label: "사용자 관리",
    title: "사용자 관리",
    icon: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 20a6 6 0 0112 0M16 11a3 3 0 100-6M18 20a5 5 0 00-2-4",
  },
  {
    path: "/admin/site",
    label: "사이트 관리",
    title: "사이트 관리",
    icon: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 000 18a14 14 0 000-18",
  },
  {
    path: "/admin/questions",
    label: "Q&A 관리",
    title: "Q&A 관리",
    icon: "M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z",
  },
  {
    path: "/admin/stock-game",
    label: "주식게임 관리",
    title: "주식게임 관리",
    icon: "M4 19h16M7 16V9M12 16V5M17 16v-4",
    // 와이어프레임에 메뉴만 있고 화면이 없다. 라우트도 없어 눌러도 아무 일이 없어야 한다.
    disabled: true,
  },
  {
    path: "/admin/settings",
    label: "설정",
    title: "설정",
    icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1v.3a2 2 0 11-4 0v-.2a1.6 1.6 0 00-2.8-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 004 15a2 2 0 01-2-2 2 2 0 012-2 1.6 1.6 0 001.1-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 009 4.6V4a2 2 0 114 0v.2a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1A1.6 1.6 0 0020 11a2 2 0 010 4z",
  },
] as const;

/**
 * 현재 경로에 해당하는 메뉴.
 *
 * `/admin` 은 다른 모든 어드민 경로의 접두사라 `startsWith` 로 찾으면 항상 대시보드가 걸린다.
 * 가장 긴 경로부터 확인해 하위 경로가 먼저 매칭되게 한다.
 */
export function findActiveMenu(pathname: string): AdminMenuItem | undefined {
  return [...ADMIN_MENU]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
}
