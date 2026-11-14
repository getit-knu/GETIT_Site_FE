import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getActivityPhotos,
  getEvents,
  getFaqs,
  getFestaProjects,
  getHome,
  getProjects,
  getRecruitmentStatus,
} from "../apis/public/publicApi";
import type { HomeResult } from "../types/home";

import HomePage from "./HomePage";

// 쇼케이스 전환(#359)만 본다 — 평소 홈 섹션 순서·스크롤 스냅 타이밍은 HomePage.test.tsx.
vi.mock("../apis/public/publicApi");

function home(mockInvestment: boolean): HomeResult {
  return { curriculums: [], featuredProjects: [], features: { stockGame: false, mockInvestment } };
}

function mockOtherApis() {
  vi.mocked(getRecruitmentStatus).mockReturnValue(new Promise(() => {}));
  vi.mocked(getFaqs).mockResolvedValue([]);
  vi.mocked(getFestaProjects).mockResolvedValue([]);
  vi.mocked(getEvents).mockImplementation((year, month) => Promise.resolve({ year, month, events: [] }));
  vi.mocked(getActivityPhotos).mockResolvedValue([]);
  vi.mocked(getProjects).mockResolvedValue({
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    semesters: [],
  });
}

/**
 * `retry`를 넘기면 앱처럼 재시도를 켠다. 기본은 끔 — 대부분 테스트는 재시도와 무관하고, 켜 두면
 * 실패 케이스가 재시도 대기 시간만큼 느려진다.
 */
function renderHome(retry: number | false = false) {
  mockOtherApis();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry, retryDelay: 60_000 } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={createMemoryRouter([{ path: "/", Component: HomePage }], { initialEntries: ["/"] })} />
    </QueryClientProvider>,
  );
}

describe("HomePage — FESTA 전환", () => {
  afterEach(() => {
    document.documentElement.classList.remove("home-scroll-snap");
  });

  it("mockInvestment가 켜져 있으면 평소 홈 대신 FESTA 쇼케이스를 그린다", async () => {
    vi.mocked(getHome).mockResolvedValue(home(true));
    renderHome();

    expect(await screen.findByRole("heading", { level: 1, name: "모의투자 FESTA" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "LET'S MAKEANYTHING." })).not.toBeInTheDocument();
  });

  it("FESTA 화면에서는 홈 스크롤 스냅을 켜지 않는다", async () => {
    vi.mocked(getHome).mockResolvedValue(home(true));
    renderHome();
    await screen.findByRole("heading", { level: 1, name: "모의투자 FESTA" });

    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.documentElement).not.toHaveClass("home-scroll-snap");
  });

  it("mockInvestment가 꺼져 있으면 평소 홈을 그린다", async () => {
    vi.mocked(getHome).mockResolvedValue(home(false));
    renderHome();

    expect(await screen.findByRole("heading", { name: "LET'S MAKEANYTHING." })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "모의투자 FESTA" })).not.toBeInTheDocument();
  });

  it("응답이 오기 전에는 어느 쪽도 그리지 않는다 — 평소 홈이 번쩍했다 바뀌지 않게", () => {
    vi.mocked(getHome).mockReturnValue(new Promise(() => {}));
    renderHome();

    expect(screen.queryByRole("heading", { name: "LET'S MAKEANYTHING." })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "모의투자 FESTA" })).not.toBeInTheDocument();
  });

  it("첫 시도가 실패하면 재시도를 기다리지 않고 바로 평소 홈을 그린다(#361 리뷰)", async () => {
    // 앱처럼 재시도 2회를 켠다. 재시도 간격을 1분으로 둬서, 재시도를 기다렸다면 화면이 영영 안 나온다.
    vi.mocked(getHome).mockRejectedValue(new Error("network"));
    renderHome(2);

    expect(await screen.findByRole("heading", { name: "LET'S MAKEANYTHING." })).toBeInTheDocument();
  });

  it("응답이 늦으면 대기 시간이 지난 뒤 평소 홈을 그리고, 늦게 온 응답이 행사 중이면 쇼케이스로 바꾼다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let resolveHome: (value: HomeResult) => void = () => {};
    vi.mocked(getHome).mockReturnValue(new Promise((resolve) => (resolveHome = resolve)));
    renderHome();

    expect(screen.queryByRole("heading", { name: "LET'S MAKEANYTHING." })).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(await screen.findByRole("heading", { name: "LET'S MAKEANYTHING." })).toBeInTheDocument();

    await act(async () => {
      resolveHome(home(true));
    });
    expect(await screen.findByRole("heading", { level: 1, name: "모의투자 FESTA" })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("홈 응답이 실패하면 평소 홈으로 돌아간다", async () => {
    vi.mocked(getHome).mockRejectedValue(new Error("network"));
    renderHome();

    expect(await screen.findByRole("heading", { name: "LET'S MAKEANYTHING." })).toBeInTheDocument();
  });
});
