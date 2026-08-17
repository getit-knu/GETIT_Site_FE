import clsx from "clsx";
import { NavLink } from "react-router";

import styles from "./Nav.module.scss";

/**
 * 공개 사이트 상단 네비게이션.
 *
 * 프로젝트 · 운영진 · 로그인 · 지원하기는 아직 화면이 없어 링크로 두면 눌렀을 때 404로
 * 떨어진다. 그렇다고 목록에서 빼면 와이어프레임과 달라지므로, 홈만 실제 링크로 두고
 * 나머지는 클릭되지 않는 텍스트로 남긴다. 각 페이지가 생기면 그때 링크로 바꾼다.
 */
export function Nav() {
  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.logo}>
          GETIT
        </NavLink>

        <div className={styles.links}>
          <NavLink to="/" end className={({ isActive }) => clsx(styles.link, isActive && styles.active)}>
            홈
          </NavLink>
          <span className={styles.link}>프로젝트</span>
          <span className={styles.link}>운영진</span>
          <span className={styles.link}>로그인</span>
          <span className={styles.cta}>지원하기</span>
        </div>
      </div>
    </header>
  );
}
