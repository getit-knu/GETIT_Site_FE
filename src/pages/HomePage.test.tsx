import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getActivityPhotos, getEvents, getFaqs, getHome, getRecruitmentStatus } from "../apis/public/publicApi";

import HomePage from "./HomePage";

// D-Day 배지 · FAQ · 커리큘럼/프로젝트 쇼케이스 · 활동 일정(publicApi)은 이 테스트의
// 관심사가 아니다 — 섹션 순서만 확인한다.
vi.mock("../apis/public/publicApi");

function renderHome() {
  vi.mocked(getRecruitmentStatus).mockReturnValue(new Promise(() => {}));
  vi.mocked(getFaqs).mockResolvedValue([{ id: 1, question: "질문", answer: "답변", order: 1 }]);
  vi.mocked(getHome).mockResolvedValue({
    curriculums: [{ id: 1, order: 1, title: "GETIT Chat", subtitle: "" }],
    featuredProjects: [{ id: 1, title: "프로젝트", description: "설명", thumbnailUrl: null }],
    features: { stockGame: false, mockInvestment: false },
  });
  vi.mocked(getEvents).mockImplementation((year, month) => Promise.resolve({ year, month, events: [] }));
  vi.mocked(getActivityPhotos).mockResolvedValue([{ id: 1, imageUrl: "https://cdn/photo.jpg", order: 1 }]);

  const router = createMemoryRouter([{ path: "/", Component: HomePage }], { initialEntries: ["/"] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("HomePage", () => {
  afterEach(() => {
    // 클래스를 직접 건드리는 테스트가 있어, 다음 테스트로 새지 않게 정리한다.
    document.documentElement.classList.remove("home-scroll-snap");
  });

  it("Figma 와이어프레임 순서대로 6개 섹션을 모두 렌더링한다", async () => {
    renderHome();

    await screen.findByRole("heading", { name: "자주 묻는 질문" });

    const headings = screen.getAllByRole("heading", { level: 1 }).concat(screen.getAllByRole("heading", { level: 2 }));
    const headingTexts = headings.map((heading) => heading.textContent);

    expect(headingTexts).toEqual([
      "LET'S MAKEANYTHING.",
      "GET IT과 함께한 순간들",
      "커리큘럼",
      "프로젝트 쇼케이스",
      "자주 묻는 질문",
    ]);
  });

  it("스크롤 스냅은 마운트 즉시가 아니라 한 프레임 미뤄서 켠다(#297)", async () => {
    // 새로고침 직후 <ScrollRestoration />(또는 브라우저)이 스크롤 위치를 복원하는 동안
    // scroll-snap-type: mandatory가 이미 걸려 있으면, 그 복원 시도가 "가장 가까운 스냅
    // 지점"(Footer)으로 되돌려진다 — 그래서 마운트와 같은 틱에 켜면 안 된다.
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb: FrameRequestCallback) => {
        frames.push(cb);
        return frames.length;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    renderHome();
    await screen.findByRole("heading", { name: "LET'S MAKEANYTHING." });

    expect(document.documentElement).not.toHaveClass("home-scroll-snap");
    expect(frames).toHaveLength(1);

    frames[0](0);

    expect(document.documentElement).toHaveClass("home-scroll-snap");

    vi.unstubAllGlobals();
  });
});
