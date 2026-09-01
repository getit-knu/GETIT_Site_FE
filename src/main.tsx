import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { setOnSessionEnded } from "./apis/client.ts";
import { queryKeys } from "./apis/queryKeys.ts";
import { createQueryClient } from "./apis/queryClient.ts";
import { ErrorBoundary } from "./errors/ErrorBoundary.tsx";
import { installViewTransitionGuard } from "./libs/viewTransitionGuard.ts";
import { router } from "./routes.tsx";
import "./index.css";
import "./styles/main.scss";

// devtools 는 개발 환경에서만 부른다. 정적 import 로 두면 배포 번들에 그대로 들어간다.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })))
  : null;

// 페이지 전환이 건너뛰어질 때 react-router 가 흘리는 rejection 을 받아 준다(libs/viewTransitionGuard).
// 라우터가 첫 이동을 하기 전에 걸어야 해서 render 보다 앞에 둔다.
installViewTransitionGuard();

/*
 * 새로고침하면 언제나 맨 위에서 시작한다.
 *
 * `<ScrollRestoration />`은 스크롤 위치를 `sessionStorage`에 적어 두고 **새로고침 뒤에도**
 * 그 자리로 되돌린다. 홈에서는 그게 해로웠다 — 홈은 `scroll-snap-type: y mandatory`를 쓰는데
 * (`index.css`), 복원이 도는 시점엔 React가 아직 문서를 다 채우지 못해 `scrollHeight`가
 * 최종값의 30%뿐이다. 그 짧은 문서에 이전 위치(예: 1497)를 복원하면 이미 끝을 넘어서 있어
 * 유일한 스냅 지점인 Footer에 붙고, 이후 문서가 길어져도 스냅이 Footer를 놓아주지 않는다.
 * 1280x720에서 홈을 스크롤한 뒤 새로고침할 때마다 맨 아래에 고정되던 버그다(#297).
 *
 * 켜는 시점을 미루는 것으로는 못 막았다 — SPA라 `readyState`가 `complete`가 되는 시점에도
 * 화면은 거의 비어 있어서 `load` 이벤트조차 신호가 되지 못한다. 그래서 **복원 자체를 하지
 * 않는다.** 새로고침은 "처음부터 다시 본다"는 뜻으로 읽는 편이 이 사이트에는 더 자연스럽고,
 * 스냅과 문서 높이의 경쟁이라는 문제의 뿌리를 통째로 없앤다.
 *
 * 세션 안에서의 뒤로가기·앞으로가기는 그대로 복원된다. react-router는 이 저장소를 마운트할 때
 * 한 번만 읽어 메모리 맵으로 옮기고 그 뒤로는 메모리 맵에 쌓기 때문이다 — 여기서 지우는 것은
 * "지난 문서가 남긴 기록"뿐이다.
 */
sessionStorage.removeItem("react-router-scroll-positions");

const queryClient = createQueryClient();

// 세션이 끝나면(재발급까지 실패) auth.me를 무효화해 RequireRole이 반응하게 한다(#295).
setOnSessionEnded(() => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {ReactQueryDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
