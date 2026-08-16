import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useNavigate } from "react-router";

import { logout } from "../../apis/auth/authApi";
import { clearAccessToken } from "../../libs/accessToken";

import styles from "./AdminLayout.module.scss";
import { Sidebar } from "./Sidebar";

/**
 * 어드민 전 화면이 올라가는 셸.
 *
 * 권한 검사는 여기서 하지 않는다. 라우트 트리에서 `RequireRole` 이 이 레이아웃을
 * 감싸므로, 여기까지 왔다는 것은 이미 운영진이라는 뜻이다.
 */
export function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      <Sidebar onLogout={() => void handleLogout()} />
      <div className={styles.main}>
        {/* Topbar(타이틀 · 알림 · 계정)는 후속 이슈에서 이 자리에 붙인다. */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
