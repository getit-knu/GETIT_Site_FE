import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useLocation, useNavigate } from "react-router";

import { logout } from "../../apis/auth/authApi";
import { useSession } from "../../hooks/auth/useSession";
import { clearAccessToken } from "../../libs/accessToken";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = findActiveMenu(pathname)?.title ?? "운영진 관리 페이지";

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // 서버에 알리지 못해도 로그아웃은 진행한다. 여기서 멈추면 사용자는 버튼을 눌렀는데
      // 아무 일도 일어나지 않는다.
      //
      // finally 로 쓰면 정리는 되지만 예외가 그대로 밖으로 나가고,
      // 호출부가 `void` 로 버려 unhandled rejection 이 된다.
    }

    // 토큰을 들고 있는 채로 화면만 돌려보내면 사용자는 나갔다고 믿는데 요청은 계속 인증된다.
    clearAccessToken();
    queryClient.clear();
    void navigate("/", { replace: true });
  }

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
