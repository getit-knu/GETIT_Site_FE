import { useState } from "react";
import clsx from "clsx";
import { Link, NavLink, Outlet } from "react-router";

import { useLogout } from "../../hooks/auth/useLogout";

import styles from "./MemberLayout.module.scss";

const NAV_LINKS_ID = "member-nav-links";

/**
 * 부원 전 화면이 올라가는 셸.
 *
 * 권한 검사는 여기서 하지 않는다. 라우트 트리에서 `RequireRole` 이 이 레이아웃을
 * 감싸므로, 여기까지 왔다는 것은 이미 부원(또는 운영진)이라는 뜻이다.
 *
 * 운영진은 아직 화면(공개 `/leaders`)이 없어 `PublicLayout`의 `Nav`와 같은 이유로
 * 클릭되지 않는 텍스트로 남긴다. 강좌 목록(#118) · 내정보(#120)는 화면이 생겨 실제 링크다.
 *
 * 좁은 화면에서는 공개 사이트 Nav(#154)와 같은 패턴으로 메뉴를 햄버거 버튼 뒤로 숨긴다(#179).
 */
export function MemberLayout() {
  const handleLogout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.layout}>
      <header className={styles.nav}>
        <nav className={styles.inner} aria-label="부원 메뉴">
          <Link to="/" className={styles.logo} onClick={closeMenu}>
            GETIT
          </Link>

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
            <span className={styles.link}>운영진</span>
            <NavLink
              to="/member"
              end
              className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
              onClick={closeMenu}
            >
              <svg className={styles.icon} viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
                <path
                  d="M3 3.75A1.5 1.5 0 0 1 4.5 2.25H9v13.5H4.5A1.5 1.5 0 0 1 3 14.25V3.75Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 3.75a1.5 1.5 0 0 0-1.5-1.5H9v13.5h4.5a1.5 1.5 0 0 0 1.5-1.5V3.75Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
              강좌 목록
            </NavLink>
            <NavLink
              to="/member/me"
              className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
              onClick={closeMenu}
            >
              <svg className={styles.icon} viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
                <circle cx="9" cy="6" r="2.75" stroke="currentColor" strokeWidth="1.3" />
                <path
                  d="M3.5 15c0-2.9 2.46-5.25 5.5-5.25S14.5 12.1 14.5 15"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              내정보
            </NavLink>
            <button type="button" className={styles.logoutButton} onClick={() => void handleLogout()}>
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
