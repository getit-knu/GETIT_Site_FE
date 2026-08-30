import { useState } from "react";
import clsx from "clsx";
import { NavLink } from "react-router";

import { useLogout } from "../../hooks/auth/useLogout";
import { useSession } from "../../hooks/auth/useSession";
import type { Me } from "../../types/auth";

import styles from "./Nav.module.scss";

const NAV_LINKS_ID = "nav-links";

/**
 * 우측 끝 CTA 버튼. 로그인 전(또는 아직 승인 전인 GUEST)엔 "지원하기"고, 로그인한
 * 부원·운영진에게는 지원하기가 의미 없어 자기 영역으로 가는 버튼으로 바뀐다(#238).
 */
function ctaFor(user: Me | undefined): { to: string; label: string } {
  if (user?.role === "ADMIN") return { to: "/admin", label: "관리자" };
  if (user?.role === "MEMBER") return { to: "/member", label: "부원" };
  return { to: "/apply", label: "지원하기" };
}

/**
 * 공개 사이트 상단 네비게이션.
 *
 * **로그인 상태를 반영한다(#204).** 로그인 전엔 "로그인" 링크, 로그인 후엔 "로그아웃"을
 * 보여준다 — `AdminLayout`·`MemberLayout`은 원래도 `useSession()`을 썼지만 이 공개
 * Nav는 처음부터 로그인 여부를 아예 안 봤다. 역할별 진입은 별도 텍스트 링크 대신
 * CTA 버튼 하나로 통합한다(`ctaFor`) — 중복 링크를 피하기 위함이다.
 *
 * 좁은 화면에서는 로고·햄버거 버튼만 한 줄로 보이고, 메뉴는 버튼을 눌러야 펼쳐지는
 * 드롭다운으로 뺀다(#154) — 이전엔 메뉴를 로고 아래로 그냥 세로로 쌓았었다(#61).
 */
export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated } = useSession();
  const handleLogout = useLogout();
  const closeMenu = () => setMenuOpen(false);

  const cta = ctaFor(user);

  return (
    <header className={styles.nav}>
      <nav className={styles.inner} aria-label="주요 메뉴">
        <NavLink to="/" className={styles.logo} onClick={closeMenu}>
          GETIT
        </NavLink>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={menuOpen}
          aria-controls={NAV_LINKS_ID}
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <div id={NAV_LINKS_ID} className={clsx(styles.links, menuOpen && styles.open)}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
            onClick={closeMenu}
          >
            홈
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
            onClick={closeMenu}
          >
            프로젝트
          </NavLink>
          <NavLink
            to="/leaders"
            className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
            onClick={closeMenu}
          >
            운영진
          </NavLink>
          {isAuthenticated ? (
            <button
              type="button"
              className={styles.logoutButton}
              onClick={() => {
                closeMenu();
                void handleLogout();
              }}
            >
              로그아웃
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
              onClick={closeMenu}
            >
              로그인
            </NavLink>
          )}
          <NavLink to={cta.to} className={styles.cta} onClick={closeMenu}>
            {cta.label}
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
