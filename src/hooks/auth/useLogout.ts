import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { logout } from "../../apis/auth/authApi";
import { clearAccessToken } from "../../libs/accessToken";

/**
 * 로그아웃. `AdminLayout`·`MemberLayout`·공개 `Nav`가 전부 같은 순서를 따라야 한다 —
 * 서버 호출 실패해도 클라이언트 상태는 반드시 비운다(호출한 쪽에서 조용히 실패로
 * 끝나면 사용자는 버튼을 눌렀는데 아무 일도 안 일어난 것처럼 보인다).
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async function handleLogout() {
    try {
      await logout();
    } catch {
      // 서버에 알리지 못해도 로그아웃은 진행한다.
    }

    // 토큰을 들고 있는 채로 화면만 돌려보내면 사용자는 나갔다고 믿는데 요청은 계속 인증된다.
    clearAccessToken();
    queryClient.clear();
    void navigate("/", { replace: true });
  };
}
