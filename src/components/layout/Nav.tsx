import clsx from "clsx";
import { NavLink } from "react-router";

import styles from "./Nav.module.scss";

/**
 * 공개 사이트 상단 네비게이션.
 *
 * 로그인 화면(`/login`)이 생겨 이제 모든 항목이 실제 링크다.
 */
export function Nav() {
  return (
    <header className={styles.nav}>
      <nav className={styles.inner} aria-label="주요 메뉴">
        <NavLink to="/" className={styles.logo}>
          GETIT
        </NavLink>

        <div className={styles.links}>
          <NavLink to="/" end className={({ isActive }) => clsx(styles.link, isActive && styles.active)}>
            홈
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => clsx(styles.link, isActive && styles.active)}>
            프로젝트
          </NavLink>
          <NavLink to="/leaders" className={({ isActive }) => clsx(styles.link, isActive && styles.active)}>
            운영진
          </NavLink>
          <NavLink to="/login" className={({ isActive }) => clsx(styles.link, isActive && styles.active)}>
            로그인
          </NavLink>
          <NavLink to="/apply" className={styles.cta}>
            지원하기
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
