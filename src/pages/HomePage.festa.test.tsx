import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getActivityPhotos,
  getEvents,
  getFaqs,
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

function renderHome() {
  mockOtherApis();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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

  it("홈 응답이 실패하면 평소 홈으로 돌아간다", async () => {
    vi.mocked(getHome).mockRejectedValue(new Error("network"));
    renderHome();

    expect(await screen.findByRole("heading", { name: "LET'S MAKEANYTHING." })).toBeInTheDocument();
  });
});
