import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/lecture/lecturesApi";
import type { Lecture, LectureBoard } from "../../types/lecture";

import LecturesPage from "./LecturesPage";

vi.mock("../../apis/lecture/lecturesApi");

function lecture(over: Partial<Lecture> = {}): Lecture {
  return {
    id: 101,
    week: 1,
    title: "HTML/CSS 기초",
    description: "웹 개발의 시작",
    deadline: "2026-06-05",
    submittedCount: 45,
    totalCount: 48,
    feedbackDoneCount: 22,
    isPublished: true,
    ...over,
  };
}

function board(over: Partial<LectureBoard> = {}): LectureBoard {
  return {
    tracks: [
      {
        id: 1,
        name: "SW",
        subCategories: [
          { id: 1, name: "WEB 기초" },
          { id: 2, name: "React.js" },
        ],
      },
      { id: 2, name: "창업 빌드업", subCategories: [] },
    ],
    lectures: [lecture()],
    ...over,
  };
}

function renderPage(entry = "/admin/lectures") {
  const router = createMemoryRouter([{ path: "/admin/lectures", element: <LecturesPage /> }], {
    initialEntries: [entry],
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("LecturesPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getLectures).mockResolvedValue(board());
    vi.mocked(api.deleteLecture).mockResolvedValue();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("응답에 실린 트랙으로 탭을 만든다", async () => {
    // 탭 구성이 목록과 함께 온다. 따로 조회하지 않는다.
    renderPage();

    const tabs = await screen.findByRole("tablist", { name: "트랙" });
    expect(within(tabs).getByRole("tab", { name: "SW" })).toBeInTheDocument();
    expect(within(tabs).getByRole("tab", { name: "창업 빌드업" })).toBeInTheDocument();
  });

  it("강의를 카드로 그린다", async () => {
    renderPage();

    expect(await screen.findByText("HTML/CSS 기초")).toBeInTheDocument();
    expect(screen.getByText("Week 1")).toBeInTheDocument();
    expect(screen.getByText("제출 45/48")).toBeInTheDocument();
    expect(screen.getByText("피드백 22")).toBeInTheDocument();
  });

  it("미공개 강의를 구분해 보여준다", async () => {
    vi.mocked(api.getLectures).mockResolvedValue(board({ lectures: [lecture({ isPublished: false })] }));
    renderPage();

    expect(await screen.findByText("미공개")).toBeInTheDocument();
  });

  it("공개 강의에는 미공개 표시가 없다", async () => {
    renderPage();

    await screen.findByText("HTML/CSS 기초");
    expect(screen.queryByText("미공개")).not.toBeInTheDocument();
  });

  it("트랙을 고르면 URL 과 조회 조건에 함께 반영된다", async () => {
    const router = renderPage();
    await screen.findByText("HTML/CSS 기초");

    await userEvent.click(screen.getByRole("tab", { name: "SW" }));

    expect(router.state.location.search).toContain("trackId=1");
    expect(api.getLectures).toHaveBeenLastCalledWith(expect.objectContaining({ trackId: 1 }));
  });

  it("소분류가 있는 트랙에서만 소분류 탭을 그린다", async () => {
    renderPage("/admin/lectures?trackId=1");

    expect(await screen.findByRole("tablist", { name: "소분류" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "WEB 기초" })).toBeInTheDocument();
  });

  it("소분류가 없는 트랙에서는 소분류 탭이 없다", async () => {
    // 창업 빌드업 · 세미나는 subCategories 가 빈 배열이다.
    renderPage("/admin/lectures?trackId=2");

    await screen.findByText("HTML/CSS 기초");
    expect(screen.queryByRole("tablist", { name: "소분류" })).not.toBeInTheDocument();
  });

  it("트랙을 바꾸면 소분류 선택을 함께 지운다", async () => {
    // 남겨 두면 다른 트랙의 소분류가 조건에 남아 결과가 늘 비어 버린다.
    const router = renderPage("/admin/lectures?trackId=1&subCategoryId=2");
    await screen.findByText("HTML/CSS 기초");

    await userEvent.click(screen.getByRole("tab", { name: "창업 빌드업" }));

    expect(router.state.location.search).not.toContain("subCategoryId");
    expect(api.getLectures).toHaveBeenLastCalledWith({ trackId: 2, subCategoryId: undefined });
  });

  it("이상한 trackId 는 없는 것으로 본다", async () => {
    // Number("0x10") 은 16 이다. 그대로 실리면 없는 트랙을 조회한다.
    renderPage("/admin/lectures?trackId=0x10");

    await screen.findByText("HTML/CSS 기초");
    expect(api.getLectures).toHaveBeenCalledWith({ trackId: undefined, subCategoryId: undefined });
  });

  it("제출물이 있는 강의를 지울 때 무엇이 사라지는지 알려 준다", async () => {
    const confirm = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", confirm);
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "삭제" }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("제출물 45건도 함께 사라집니다"));
    expect(api.deleteLecture).toHaveBeenCalledWith(101);
  });

  it("확인을 취소하면 지우지 않는다", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "삭제" }));

    expect(api.deleteLecture).not.toHaveBeenCalled();
  });

  it("강의가 없으면 빈 상태를 보여준다", async () => {
    vi.mocked(api.getLectures).mockResolvedValue(board({ lectures: [] }));
    renderPage();

    expect(await screen.findByText("등록된 강의가 없습니다.")).toBeInTheDocument();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getLectures).mockRejectedValue({ code: "UNKNOWN_ERROR", message: "실패" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("강의 목록을 불러오지 못했습니다.");
  });
});
