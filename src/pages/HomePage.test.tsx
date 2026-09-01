import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter, Outlet, RouterProvider, ScrollRestoration } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getActivityPhotos, getEvents, getFaqs, getHome, getRecruitmentStatus } from "../apis/public/publicApi";

import HomePage from "./HomePage";

// D-Day 배지 · FAQ · 커리큘럼/프로젝트 쇼케이스 · 활동 일정(publicApi)은 이 테스트의
// 관심사가 아니다 — 섹션 순서만 확인한다.
vi.mock("../apis/public/publicApi");

function mockPublicApis() {
  vi.mocked(getRecruitmentStatus).mockReturnValue(new Promise(() => {}));
  vi.mocked(getFaqs).mockResolvedValue([{ id: 1, question: "질문", answer: "답변", order: 1 }]);
  vi.mocked(getHome).mockResolvedValue({
    curriculums: [{ id: 1, order: 1, title: "GETIT Chat", subtitle: "" }],
    featuredProjects: [{ id: 1, title: "프로젝트", description: "설명", thumbnailUrl: null }],
    features: { stockGame: false, mockInvestment: false },
  });
  vi.mocked(getEvents).mockImplementation((year, month) => Promise.resolve({ year, month, events: [] }));
  vi.mocked(getActivityPhotos).mockResolvedValue([{ id: 1, imageUrl: "https://cdn/photo.jpg", order: 1 }]);
}

/*
 * `StrictMode` 로 감싸서 렌더한다 — 앱은 `main.tsx` 에서 StrictMode 안에 있는데 테스트만
 * 벗겨 놓으면, StrictMode 가 일부러 드러내는 부작용(이펙트 이중 실행 등)을 테스트가
 * 통과시켜 버린다. 스냅 클래스는 이펙트로 켜고 끄므로 특히 여기서 중요하다.
 */
function renderInRouter(router: ReturnType<typeof createMemoryRouter>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

function renderHome() {
  mockPublicApis();
  return renderInRouter(createMemoryRouter([{ path: "/", Component: HomePage }], { initialEntries: ["/"] }));
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
    const cancel = vi.fn();
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb: FrameRequestCallback) => {
        frames.push(cb);
        return frames.length;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", cancel);

    renderHome();
    await screen.findByRole("heading", { name: "LET'S MAKEANYTHING." });

    expect(document.documentElement).not.toHaveClass("home-scroll-snap");
    // StrictMode가 이펙트를 마운트→정리→마운트로 두 번 돌리므로 예약도 두 번, 첫 예약은
    // 정리에서 취소된다. 살아남는 것은 마지막 프레임 하나뿐이다.
    expect(frames).toHaveLength(2);
    expect(cancel).toHaveBeenCalledWith(1);

    act(() => {
      frames[frames.length - 1](0);
    });

    expect(document.documentElement).toHaveClass("home-scroll-snap");

    vi.unstubAllGlobals();
  });

  it("다른 라우트로 넘어갈 때 스크롤 복귀보다 먼저 스냅을 끈다", async () => {
    /*
     * `<ScrollRestoration />`은 라우트가 바뀌면 **레이아웃 이펙트**에서 `window.scrollTo(0, 0)`
     * 을 부른다(react-router `useScrollRestoration`). 그때까지 `html.home-scroll-snap`이 남아
     * 있으면 `scroll-snap-type: mandatory`가 그 요청을 가로채, 그 페이지에 남은 유일한 스냅
     * 지점인 Footer(`Footer.module.scss`) — 곧 문서 맨 아래 — 로 스크롤을 끌고 간다.
     *
     * jsdom은 레이아웃도 스냅도 계산하지 않으니 "맨 위로 갔는가"로는 확인할 수 없다. 확인
     * 가능한 것은 **순서**뿐이라, `scrollTo`가 불리는 순간 스냅이 이미 꺼져 있었는지를 본다.
     * 클래스 제거를 passive cleanup(`useEffect`)에 두면 이 단언이 깨진다 — 레이아웃 이펙트가
     * 페인트 전에, passive cleanup이 페인트 뒤에 돌기 때문이다.
     */
    const snapArmedAtScrollReset: boolean[] = [];
    vi.stubGlobal(
      "scrollTo",
      vi.fn(() => {
        snapArmedAtScrollReset.push(document.documentElement.classList.contains("home-scroll-snap"));
      }),
    );

    mockPublicApis();
    const router = createMemoryRouter(
      [
        {
          // `routes.tsx`의 루트 라우트와 같은 모양 — <ScrollRestoration />이 라우터 트리 안에
          // 있어야 스크롤 복귀가 실제로 돈다.
          Component: () => (
            <>
              <ScrollRestoration />
              <Outlet />
            </>
          ),
          children: [
            { path: "/", Component: HomePage },
            { path: "/projects", Component: () => <h1>프로젝트</h1> },
          ],
        },
      ],
      { initialEntries: ["/"] },
    );
    renderInRouter(router);

    // 스냅이 실제로 켜진 뒤에 떠나야 의미가 있다 — 안 켜진 상태로 이동하면 무엇도 증명하지
    // 못하고 통과해 버린다.
    await waitFor(() => expect(document.documentElement).toHaveClass("home-scroll-snap"));
    snapArmedAtScrollReset.length = 0;

    await act(async () => {
      await router.navigate("/projects");
    });

    await screen.findByRole("heading", { name: "프로젝트" });
    expect(snapArmedAtScrollReset.length).toBeGreaterThan(0);
    expect(snapArmedAtScrollReset).not.toContain(true);

    vi.unstubAllGlobals();
  });
});
