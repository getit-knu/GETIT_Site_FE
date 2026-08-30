import { useState } from "react";
import { Outlet, useLocation } from "react-router";

import { useLogout } from "../../hooks/auth/useLogout";
import { useSession } from "../../hooks/auth/useSession";

import styles from "./AdminLayout.module.scss";
import { findActiveMenu } from "./adminMenu";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * 어드민 전 화면이 올라가는 셸.
 *
 * 권한 검사는 여기서 하지 않는다. 라우트 트리에서 `RequireRole` 이 이 레이아웃을
 * 감싸므로, 여기까지 왔다는 것은 이미 운영진이라는 뜻이다.
 *
 * 사이드바는 데스크톱에선 항상 펼쳐지고, 좁은 화면에선 Topbar의 햄버거 버튼으로 여닫는
 * 오프캔버스 드로어로 전환한다(#180) — 240px 고정 사이드바가 375px 화면 대부분을
 * 차지해 본문이 쓸 수 없을 만큼 짓눌리던 문제.
 */
export function AdminLayout() {
  const { pathname } = useLocation();
  const { user } = useSession();
  const handleLogout = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = findActiveMenu(pathname)?.title ?? "운영진 관리 페이지";

  return (
    <div className={styles.layout}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={() => void handleLogout()} />
      <div className={styles.main}>
        <Topbar title={title} user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
