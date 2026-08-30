import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/lecture/memberLecturesApi";
import type { MemberLectureBoard, MemberLectureCard, MemberLectureListParams, MemberTrack } from "../../types/lecture";

import LectureListPage from "./LectureListPage";

vi.mock("../../apis/lecture/memberLecturesApi");

const TRACKS: MemberTrack[] = [
  { id: 1, name: "SW", subCategories: [{ id: 1, name: "WEB 기초" }] },
  { id: 2, name: "창업 빌드업", subCategories: [] },
];

const ALL_CARDS: MemberLectureCard[] = [
  {
    id: 1,
    week: 1,
    title: "HTML/CSS 기초",
    subCategoryName: "WEB 기초",
    trackName: "SW",
    durationMinutes: 90,
    deadline: "2026-06-05T23:59:00+09:00",
    completed: true,
  },
  {
    id: 2,
    week: 1,
    title: "린 캔버스 작성법",
    subCategoryName: null,
    trackName: "창업 빌드업",
    durationMinutes: 60,
    deadline: null,
    completed: false,
  },
];

function board(content: MemberLectureCard[]): MemberLectureBoard {
  return { content, page: 0, size: 12, totalElements: content.length, totalPages: 1, first: true, last: true };
}

function renderAt(path = "/member") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/member", element: <LectureListPage /> },
      { path: "/member/lectures/:id", element: <p>강의 시청</p> },
    ],
    { initialEntries: [path] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("LectureListPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getMemberTracks).mockResolvedValue(TRACKS);
    vi.mocked(api.getMemberLectures).mockImplementation(async (params: MemberLectureListParams) => {
      if (params.subCategoryId === 1) return board([ALL_CARDS[0]]);
      return board(ALL_CARDS);
    });
  });

  it("헤더 · 트랙 탭 · 강의 카드를 렌더링한다", async () => {
    renderAt();

    expect(screen.getByRole("heading", { name: "강좌 목록" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "WEB 기초" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "창업 빌드업" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "HTML/CSS 기초" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "린 캔버스 작성법" })).toBeInTheDocument();
  });

  it("필터 탭을 선택하면 해당 소분류만 서버에 조회한다", async () => {
    renderAt();

    fireEvent.click(await screen.findByRole("button", { name: "WEB 기초" }));

    expect(await screen.findByRole("heading", { name: "HTML/CSS 기초" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "린 캔버스 작성법" })).not.toBeInTheDocument();
    expect(api.getMemberLectures).toHaveBeenLastCalledWith({ trackId: 1, subCategoryId: 1, page: 0 });
  });

  it("카드를 클릭하면 강의 시청 페이지로 이동한다", async () => {
    renderAt();

    fireEvent.click(await screen.findByRole("heading", { name: "HTML/CSS 기초" }));

    expect(screen.getByText("강의 시청")).toBeInTheDocument();
  });

  it("등록된 강의가 없으면 안내 문구를 보여준다", async () => {
    vi.mocked(api.getMemberLectures).mockResolvedValue(board([]));
    renderAt();

    expect(await screen.findByText("등록된 강의가 없습니다.")).toBeInTheDocument();
  });
});
