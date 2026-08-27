import { useState } from "react";
import clsx from "clsx";
import { NavLink } from "react-router";

import styles from "./Nav.module.scss";

const NAV_LINKS_ID = "nav-links";

/**
 * 공개 사이트 상단 네비게이션.
 *
 * 로그인 화면(`/login`)이 생겨 이제 모든 항목이 실제 링크다.
 *
 * 좁은 화면에서는 로고·햄버거 버튼만 한 줄로 보이고, 메뉴는 버튼을 눌러야 펼쳐지는
 * 드롭다운으로 뺀다(#154) — 이전엔 메뉴를 로고 아래로 그냥 세로로 쌓았었다(#61).
 */
export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

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
          <NavLink
            to="/login"
            className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
            onClick={closeMenu}
          >
            로그인
          </NavLink>
          <NavLink to="/apply" className={styles.cta} onClick={closeMenu}>
            지원하기
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
