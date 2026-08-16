import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "../../apis/auth/authApi";
import type { Me } from "../../types/auth";

import { useSession } from "./useSession";

vi.mock("../../apis/auth/authApi");

const mockedGetMe = vi.mocked(getMe);

const admin: Me = {
  id: 1,
  email: "admin@getit.com",
  name: "김운영",
  phoneNumber: null,
  college: null,
  major: null,
  studentYear: null,
  studentNumber: null,
  profileImageUrl: null,
  role: "ADMIN",
  generationNo: null,
  status: "ACTIVE",
};

function Probe() {
  const { user, isLoading, isAuthenticated } = useSession();
  return (
    <p data-testid="state">{`${isLoading ? "loading" : "settled"}:${isAuthenticated ? "in" : "out"}:${user?.name ?? "없음"}`}</p>
  );
}

/** 같은 QueryClient 를 계속 쓰면서 마운트를 반복해야 캐시가 남는 상황을 만들 수 있다. */
function makeHarness() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

const state = () => screen.getByTestId("state").textContent;

describe("useSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("조회에 성공하면 로그인 상태다", async () => {
    mockedGetMe.mockResolvedValue(admin);
    const { wrapper } = makeHarness();

    render(<Probe />, { wrapper });

    await expect.poll(state).toBe("settled:in:김운영");
  });

  it("조회에 실패하면 비로그인 상태다", async () => {
    mockedGetMe.mockRejectedValue({ code: "UNAUTHORIZED", message: "인증이 필요합니다" });
    const { wrapper } = makeHarness();

    render(<Probe />, { wrapper });

    await expect.poll(state).toBe("settled:out:없음");
  });

  it("판정 중에는 로그인으로 보지 않는다", () => {
    mockedGetMe.mockReturnValue(new Promise(() => {}));
    const { wrapper } = makeHarness();

    render(<Probe />, { wrapper });

    expect(state()).toBe("loading:out:없음");
  });

  it("세션이 만료돼 재조회가 401 이면 로그인 상태가 풀린다", async () => {
    // TanStack Query 는 재조회가 실패해도 직전에 성공한 data 를 남겨 둔다.
    // data 존재 여부만으로 로그인을 판단하면, 세션이 끊긴 뒤에도 계속 로그인으로 보인다.
    mockedGetMe.mockResolvedValueOnce(admin);
    const { queryClient, wrapper } = makeHarness();

    const { unmount } = render(<Probe />, { wrapper });
    await expect.poll(state).toBe("settled:in:김운영");
    unmount();

    mockedGetMe.mockRejectedValue({ code: "UNAUTHORIZED", message: "인증이 필요합니다" });
    await queryClient.refetchQueries();

    render(<Probe />, { wrapper });

    await expect.poll(state).toBe("settled:out:없음");
  });
});
