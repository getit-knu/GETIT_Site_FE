import { useState } from "react";
import clsx from "clsx";
import { NavLink } from "react-router";

import { useLogout } from "../../hooks/auth/useLogout";
import { useSession } from "../../hooks/auth/useSession";
import type { Role } from "../../types/auth";

import styles from "./Nav.module.scss";

const NAV_LINKS_ID = "nav-links";

/** 로그인한 역할별로 자기 영역으로 가는 링크. 아직 승인 전인 GUEST는 갈 곳이 없어 `null`. */
function areaLinkFor(role: Role): { to: string; label: string } | null {
  if (role === "ADMIN") return { to: "/admin", label: "관리자 페이지" };
  if (role === "MEMBER") return { to: "/member", label: "부원 페이지" };
  return null;
}

/**
 * 공개 사이트 상단 네비게이션.
 *
 * **로그인 상태를 반영한다(#204).** 로그인 전엔 "로그인" 링크, 로그인 후엔 역할별
 * 진입 링크(GUEST는 없음)와 "로그아웃"을 보여준다 — `AdminLayout`·`MemberLayout`은
 * 원래도 `useSession()`을 썼지만 이 공개 Nav는 처음부터 로그인 여부를 아예 안 봤다.
 *
 * 좁은 화면에서는 로고·햄버거 버튼만 한 줄로 보이고, 메뉴는 버튼을 눌러야 펼쳐지는
 * 드롭다운으로 뺀다(#154) — 이전엔 메뉴를 로고 아래로 그냥 세로로 쌓았었다(#61).
 */
export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated } = useSession();
  const handleLogout = useLogout();
  const closeMenu = () => setMenuOpen(false);

  const areaLink = user !== undefined ? areaLinkFor(user.role) : null;

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
            <>
              {areaLink !== null && (
                <NavLink
                  to={areaLink.to}
                  className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
                  onClick={closeMenu}
                >
                  {areaLink.label}
                </NavLink>
              )}
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
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
              onClick={closeMenu}
            >
              로그인
            </NavLink>
          )}
          <NavLink to="/apply" className={styles.cta} onClick={closeMenu}>
            지원하기
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
