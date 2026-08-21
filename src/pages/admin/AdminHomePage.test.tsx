import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/dashboard/dashboardApi";

import AdminHomePage from "./AdminHomePage";

vi.mock("../../apis/dashboard/dashboardApi");

function mockAll() {
  vi.mocked(api.getSummary).mockResolvedValue({
    totalApplicants: 124,
    memberCount: 48,
    unEvaluatedAssignmentCount: 23,
    unansweredQuestionCount: 8,
  });
  vi.mocked(api.getRecentQuestions).mockResolvedValue([
    {
      id: 7010,
      authorName: "김부원",
      content: "과제 제출 기한 문의",
      createdAt: "2026-01-01T06:04:22.000Z",
      elapsedLabel: "1시간 전",
      lectureTitle: null,
    },
  ]);
  vi.mocked(api.getSubmissionStatus).mockResolvedValue({
    totalMemberCount: 48,
    weeks: [{ lectureId: 101, week: 1, title: "Python 기초", submittedCount: 45, totalCount: 48, rate: 93.8 }],
  });
  vi.mocked(api.getUpcomingEvents).mockResolvedValue([
    { id: 11, title: "GETIT Chat", place: "IT5호관", startDate: "2026-08-02", dDay: 7, type: "EVENT" },
  ]);
  vi.mocked(api.getOngoingLectures).mockResolvedValue([
    {
      id: 210,
      title: "창업 빌드업 4차시",
      subCategoryName: "창업 빌드업",
      deadline: "2026-09-01",
      submittedCount: 12,
      totalCount: 48,
    },
  ]);
}

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: "/admin", element: <AdminHomePage /> },
      { path: "/admin/questions", element: <p>Q&A 화면</p> },
    ],
    { initialEntries: ["/admin"] },
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("AdminHomePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAll();
  });

  it("카운터 4종을 보여준다", async () => {
    renderPage();

    expect(await screen.findByText("124")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("카드 하나가 실패해도 나머지는 그대로 보인다", async () => {
    // 5개를 한 쿼리로 묶었다면 여기서 화면 전체가 오류가 된다.
    vi.mocked(api.getSubmissionStatus).mockRejectedValue({ code: "UNKNOWN_ERROR", message: "실패" });

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("과제 제출 현황");
    expect(await screen.findByText("124")).toBeInTheDocument();
    expect(await screen.findByText("과제 제출 기한 문의")).toBeInTheDocument();
    expect(await screen.findByText("GETIT Chat")).toBeInTheDocument();
  });

  it("경과 시간은 서버가 준 값을 그대로 쓴다", async () => {
    // FE 에서 다시 계산하면 서버와 어긋난다.
    renderPage();

    expect(await screen.findByText(/1시간 전/)).toBeInTheDocument();
  });

  it("제출률을 접근 가능한 진행 막대로 그린다", async () => {
    renderPage();

    const bar = await screen.findByRole("progressbar", { name: "Python 기초 제출률" });
    expect(bar).toHaveAttribute("aria-valuenow", "94");
  });

  it("D-day 를 표기하고 당일은 D-DAY 로 쓴다", async () => {
    renderPage();
    expect(await screen.findByText("D-7")).toBeInTheDocument();

    vi.mocked(api.getUpcomingEvents).mockResolvedValue([
      { id: 12, title: "오늘 행사", place: "IT5호관", startDate: "2026-01-01", dDay: 0, type: "EVENT" },
    ]);
    renderPage();

    expect(await screen.findByText("D-DAY")).toBeInTheDocument();
  });

  it("미확인 Q&A 가 없으면 빈 상태를 보여준다", async () => {
    vi.mocked(api.getRecentQuestions).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("미확인 질문이 없습니다.")).toBeInTheDocument();
  });

  it("카운터가 0 이어도 빈 상태로 치지 않는다", async () => {
    vi.mocked(api.getSummary).mockResolvedValue({
      totalApplicants: 0,
      memberCount: 0,
      unEvaluatedAssignmentCount: 0,
      unansweredQuestionCount: 0,
    });

    renderPage();

    expect(await screen.findByText("총 지원자")).toBeInTheDocument();
    expect(screen.queryByText("집계할 데이터가 없습니다.")).not.toBeInTheDocument();
  });

  it("미확인 Q&A 를 누르면 해당 질문의 답변 모달로 간다", async () => {
    const router = renderPage();

    const link = await screen.findByRole("link", { name: /과제 제출 기한 문의/ });
    expect(link).toHaveAttribute("href", "/admin/questions?modal=answer&id=7010");
    expect(router).toBeDefined();
  });
});
