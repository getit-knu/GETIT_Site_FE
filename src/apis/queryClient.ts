import { QueryClient } from "@tanstack/react-query";

import type { ApiErrorPayload } from "./client";

/** 인증·권한 오류는 재시도해도 결과가 같다. 네트워크 오류만 재시도한다. */
const NON_RETRYABLE_CODES = new Set(["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND"]);

function isApiErrorPayload(error: unknown): error is ApiErrorPayload {
  return typeof error === "object" && error !== null && "code" in error;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 어드민 화면은 표를 열고 모달을 여닫는 이동이 잦다.
        // 0 으로 두면 모달을 닫을 때마다 목록을 다시 받는다.
        staleTime: 30_000,

        // 포커스가 돌아올 때마다 요청하면 탭을 오갈 때 표가 깜빡인다.
        refetchOnWindowFocus: false,

        retry: (failureCount, error) => {
          if (isApiErrorPayload(error) && NON_RETRYABLE_CODES.has(error.code)) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        // 쓰기를 자동 재시도하면 같은 요청이 두 번 반영될 수 있다.
        retry: false,
      },
    },
  });
}
