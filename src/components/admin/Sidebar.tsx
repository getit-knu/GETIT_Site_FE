import clsx from "clsx";
import { NavLink } from "react-router";

import { ADMIN_MENU } from "./adminMenu";
import styles from "./Sidebar.module.scss";

function MenuIcon({ path }: { path: string }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={path} />
    </svg>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

/**
 * 좁은 화면에서는 `open`일 때만 화면에 슬라이드해 들어오는 오프캔버스 드로어다.
 * 백드롭 클릭·메뉴 선택 시 `onClose`로 닫는다. 데스크톱에서는 `open`과 무관하게
 * 항상 보인다(CSS 미디어쿼리로만 좌우 이동시킨다).
 */
export function Sidebar({ open, onClose, onLogout }: SidebarProps) {
  return (
    <>
      {open && <div className={styles.backdrop} aria-hidden="true" onClick={onClose} />}

      <nav className={clsx(styles.sidebar, open && styles.open)} aria-label="관리자 메뉴">
        <NavLink viewTransition to="/" className={styles.brand} onClick={onClose}>
          GET IT
        </NavLink>

        <ul className={styles.menu}>
          {ADMIN_MENU.map((item) => (
            <li key={item.path}>
              {item.disabled ? (
                // 화면이 없는 메뉴를 링크로 두면 눌렀을 때 404 로 떨어진다.
                // 목록에서 빼면 와이어프레임과 달라지므로 남기되 이동을 막는다.
                <span className={clsx(styles.item, styles.disabled)} aria-disabled="true">
                  <MenuIcon path={item.icon} />
                  {item.label}
                  <span className={styles.soon}>준비 중</span>
                </span>
              ) : (
                <NavLink
                  viewTransition
                  to={item.path}
                  // `/admin` 은 모든 어드민 경로의 접두사다. end 를 주지 않으면
                  // 어느 화면에 있든 대시보드가 활성으로 남는다.
                  end={item.path === "/admin"}
                  className={({ isActive }) => clsx(styles.item, isActive && styles.active)}
                  onClick={onClose}
                >
                  <MenuIcon path={item.icon} />
                  {item.label}
                </NavLink>
              )}
            </li>
          ))}
        </ul>

        {/* 로그아웃은 메뉴가 아니라 계정 동작이라 목록에서 떼어 아래에 둔다. */}
        <button type="button" className={clsx(styles.item, styles.logout)} onClick={onLogout}>
          <MenuIcon path="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 01-2-2V6a2 2 0 012-2h6" />
          로그아웃
        </button>
      </nav>
    </>
  );
}
