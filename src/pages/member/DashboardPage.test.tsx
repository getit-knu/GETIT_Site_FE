import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/member/memberApi";
import { getMyQuestions } from "../../apis/qna/myQuestionsApi";
import type { MySummary } from "../../types/member";

import DashboardPage from "./DashboardPage";

vi.mock("../../apis/member/memberApi");
// 내 질문 카드가 실제 요청을 내보내지 않게 막는다. 카드 자체는 MyQuestionsCard 테스트가 본다.
vi.mock("../../apis/qna/myQuestionsApi");

function summary(over: Partial<MySummary> = {}): MySummary {
  return {
    profile: {
      name: "김부원",
      email: "member@getit.com",
      college: "경영대학",
      major: "경영학과",
      studentId: "202012345",
      studentYear: 21,
      profileImageUrl: "",
    },
    stats: {
      enrolledLectureCount: 8,
      submittedAssignmentCount: 10,
      notSubmittedCount: 1,
      lateSubmittedCount: 2,
    },
    notSubmittedLectures: [{ lectureId: 3, week: 3, title: "금융 이론" }],
    lateSubmittedLectures: [
      { lectureId: 1, week: 1, title: "오리엔테이션" },
      { lectureId: 5, week: 5, title: "포트폴리오 기초" },
    ],
    ...over,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // 내 질문 카드가 `Link` 를 쓴다 — 라우터 없이 그리면 질문이 하나라도 있을 때 터진다.
  const router = createMemoryRouter([{ path: "/member/dashboard", element: <DashboardPage /> }], {
    initialEntries: ["/member/dashboard"],
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("불러오는 동안 로딩 문구를 보여준다", () => {
    vi.mocked(api.getMySummary).mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
  });

  it("학습 통계와 과제 제출 내역을 실제 데이터로 렌더링한다", async () => {
    vi.mocked(api.getMySummary).mockResolvedValue(summary());
    renderPage();

    expect(await screen.findByText("8")).toBeInTheDocument();
    expect(screen.getByText("수강한 강의")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("제출한 과제")).toBeInTheDocument();

    expect(screen.getByText("Week 3 · 금융 이론")).toBeInTheDocument();
    expect(screen.getByText("Week 1 · 오리엔테이션")).toBeInTheDocument();
    expect(screen.getByText("Week 5 · 포트폴리오 기초")).toBeInTheDocument();
  });

  it("미제출·지각 제출이 없으면 목록 없이 0회만 보여준다", async () => {
    vi.mocked(api.getMySummary).mockResolvedValue(summary({ notSubmittedLectures: [], lateSubmittedLectures: [] }));
    renderPage();

    await screen.findByText("과제 제출 내역");
    expect(screen.getAllByText("0회")).toHaveLength(2);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("조회 실패 시 에러 화면을 보여주고 다시 시도할 수 있다", async () => {
    vi.mocked(api.getMySummary).mockRejectedValueOnce({ code: "FORBIDDEN", message: "?" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("정보를 볼 권한이 없습니다.");

    vi.mocked(api.getMySummary).mockResolvedValueOnce(summary());
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("수강한 강의")).toBeInTheDocument();
  });
  it("내 질문 영역이 대시보드에 있다", async () => {
    vi.mocked(api.getMySummary).mockResolvedValue(summary());
    vi.mocked(getMyQuestions).mockResolvedValue({
      content: [
        {
          id: 1,
          lectureId: 7,
          lectureTitle: "3주차",
          authorName: "김부원",
          content: "질문입니다",
          createdAt: "2026-09-01T10:00:00+09:00",
          status: "PENDING",
          answers: [],
        },
      ],
      page: 0,
      size: 5,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
    renderPage();

    expect(await screen.findByRole("heading", { name: "내 질문" })).toBeInTheDocument();
  });
});
