import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useNavigate } from "react-router";

import { logout } from "../../apis/auth/authApi";
import { clearAccessToken } from "../../libs/accessToken";

import styles from "./MemberLayout.module.scss";

/**
 * 부원 전 화면이 올라가는 셸.
 *
 * 권한 검사는 여기서 하지 않는다. 라우트 트리에서 `RequireRole` 이 이 레이아웃을
 * 감싸므로, 여기까지 왔다는 것은 이미 부원(또는 운영진)이라는 뜻이다.
 *
 * 운영진 · 강좌 목록 · 내정보는 아직 화면(공개 `/leaders`, 이 이슈의 후속인 강좌 목록 ·
 * 내정보 페이지)이 없어 `PublicLayout`의 `Nav`와 같은 이유로 클릭되지 않는 텍스트로
 * 남긴다. 각 페이지가 생기면 그때 링크로 바꾼다.
 */
export function MemberLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // AdminLayout과 같은 이유 — 서버에 알리지 못해도 로그아웃은 진행한다.
      // 여기서 멈추면 사용자는 버튼을 눌렀는데 아무 일도 일어나지 않는다.
    }

    // 토큰을 들고 있는 채로 화면만 돌려보내면 사용자는 나갔다고 믿는데 요청은 계속 인증된다.
    clearAccessToken();
    queryClient.clear();
    void navigate("/", { replace: true });
  }

  return (
    <div className={styles.layout}>
      <header className={styles.nav}>
        <nav className={styles.inner} aria-label="부원 메뉴">
          <Link to="/" className={styles.logo}>
            GETIT
          </Link>

          <div className={styles.links}>
            <span className={styles.link}>운영진</span>
            <span className={styles.link}>
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
            </span>
            <span className={styles.link}>
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
            </span>
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
