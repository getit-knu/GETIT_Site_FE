import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { setOnSessionEnded } from "./apis/client.ts";
import { queryKeys } from "./apis/queryKeys.ts";
import { createQueryClient } from "./apis/queryClient.ts";
import { ErrorBoundary } from "./errors/ErrorBoundary.tsx";
import { router } from "./routes.tsx";
import "./index.css";
import "./styles/main.scss";

// devtools 는 개발 환경에서만 부른다. 정적 import 로 두면 배포 번들에 그대로 들어간다.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })))
  : null;

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
