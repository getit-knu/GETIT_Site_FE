import clsx from "clsx";
import { NavLink } from "react-router";

import styles from "./Nav.module.scss";

/**
 * 공개 사이트 상단 네비게이션.
 *
 * 로그인은 아직 화면이 없어 링크로 두면 눌렀을 때 404로 떨어진다.
 * 그렇다고 목록에서 빼면 와이어프레임과 달라지므로, 화면이 있는 항목(홈·프로젝트·운영진·지원하기)만
 * 실제 링크로 두고 나머지는 클릭되지 않는 텍스트로 남긴다. 각 페이지가 생기면 그때 링크로 바꾼다.
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
          <span className={styles.link}>로그인</span>
          <NavLink to="/apply" className={styles.cta}>
            지원하기
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
