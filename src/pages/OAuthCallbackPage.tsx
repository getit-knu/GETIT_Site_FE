import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { getMe, refreshAccessToken } from "../apis/auth/authApi";
import { queryKeys } from "../apis/queryKeys";
import { setAccessToken } from "../libs/accessToken";
import type { Role } from "../types/auth";
import { FullScreenLoader } from "../components/ui/FullScreenLoader/FullScreenLoader";

/** 역할별 로그인 후 도착지. 아직 승인 전인 GUEST는 갈 곳이 없어 홈에 남는다. */
function destinationFor(role: Role): string {
  if (role === "ADMIN") return "/admin";
  if (role === "MEMBER") return "/member";
  return "/";
}

/**
 * 구글 로그인 후 BE 가 되돌려 보내는 지점.
 *
 * BE 는 Refresh Token 을 HttpOnly 쿠키로 심고 `?isNewUser=` 만 붙여 보낸다.
 * **Access Token 은 URL 에 실리지 않는다.** 주소창·브라우저 기록·리퍼러에 남기 때문이다.
 * 그래서 여기서 `POST /api/auth/refresh` 로 한 번 더 받아 메모리에 넣는다.
 */
export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);

  // StrictMode 는 개발 중 effect 를 두 번 돌린다. 갱신을 두 번 호출하면
  // BE 의 Refresh Token Rotation 이 두 번째를 재사용으로 보고 세션을 끊는다.
  const requested = useRef(false);

  const isNewUser = searchParams.get("isNewUser") === "true";

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    async function completeLogin() {
      try {
        const { accessToken } = await refreshAccessToken();
        setAccessToken(accessToken);

        // 토큰이 생겼으니 세션을 다시 받는다 — 역할에 따라 갈 곳이 갈리므로 직접 기다린다.
        const me = await queryClient.fetchQuery({ queryKey: queryKeys.auth.me(), queryFn: getMe });

        // TODO: 신규 사용자는 프로필 입력 화면으로 보낸다. 그 화면이 생기기 전까지는
        // 도착지에 상태로만 넘겨 둔다. 여기서 분기를 잃으면 BE 가 보낸 정보가 버려진다.
        navigate(destinationFor(me.role), { replace: true, state: { isNewUser } });
      } catch {
        setFailed(true);
      }
    }

    void completeLogin();
  }, [isNewUser, navigate, queryClient]);

  if (failed) {
    return (
      <main>
        <h1>로그인에 실패했습니다</h1>
        <button type="button" onClick={() => navigate("/", { replace: true })}>
          홈으로
        </button>
      </main>
    );
  }

  return <FullScreenLoader label="로그인하는 중이에요" />;
}
