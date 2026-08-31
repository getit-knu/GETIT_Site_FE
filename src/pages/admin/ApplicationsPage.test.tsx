import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as appApi from "../../apis/application/applicationsApi";
import * as api from "../../apis/recruitment/recruitmentApi";
import type { RecruitmentSchedule } from "../../types/recruitment";

import ApplicationsPage from "./ApplicationsPage";

vi.mock("../../apis/recruitment/recruitmentApi");
vi.mock("../../apis/application/applicationsApi");

function schedule(totalStartAt: string): RecruitmentSchedule {
  return {
    generationId: 9,
    generationNo: 9,
    year: 2026,
    totalStartAt,
    totalEndAt: "2099-12-31T23:59",
    documentStartAt: totalStartAt,
    documentEndAt: "2099-12-01T23:59",
    interviewStartAt: "2099-12-15T00:00",
    interviewEndAt: "2099-12-31T23:59",
  };
}

function renderPage(entry = "/admin/applications") {
  const router = createMemoryRouter([{ path: "/admin/applications", element: <ApplicationsPage /> }], {
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

describe("ApplicationsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(appApi.getApplicants).mockResolvedValue({
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 1,
      first: true,
      last: true,
    });
    // 아직 시작하지 않은 모집
    vi.mocked(api.getSchedule).mockResolvedValue(schedule("2099-01-01T00:00"));
    vi.mocked(api.getQuestions).mockResolvedValue([]);
    vi.mocked(api.getCriteria).mockResolvedValue({ criteria: [], totalScore: 0, valid: false });
  });

  it("기본은 지원자 목록 탭이다", async () => {
    renderPage();

    expect(await screen.findByText("접수된 지원서가 없습니다.")).toBeInTheDocument();
  });

  it("탭을 바꾸면 URL 에 남고 설정이 나온다", async () => {
    const router = renderPage();
    await screen.findByText("접수된 지원서가 없습니다.");

    await userEvent.click(screen.getByRole("tab", { name: "지원 시스템 설정" }));

    expect(router.state.location.search).toContain("tab=settings");
    expect(await screen.findByText(/모집 일정/)).toBeInTheDocument();
  });

  it("URL 에 적힌 탭으로 시작한다", async () => {
    renderPage("/admin/applications?tab=settings");

    expect(await screen.findByText(/모집 일정/)).toBeInTheDocument();
  });

  it("모집 시작 전에는 설정을 고칠 수 있다", async () => {
    renderPage("/admin/applications?tab=settings");

    await screen.findByText(/모집 일정/);
    expect(screen.getByLabelText("전체 시작")).toBeEnabled();
  });

  it("모집이 이미 시작됐어도 설정을 계속 고칠 수 있다", async () => {
    // BE는 시간 기준 잠금을 두지 않는다(RecruitmentScheduleService.updateSchedule 확인함) —
    // 화면에서 임의로 막으면 시작 뒤 마감을 늘리는 등 정상적인 관리 작업도 못 하게 된다.
    vi.mocked(api.getSchedule).mockResolvedValue(schedule("2020-01-01T00:00"));

    renderPage("/admin/applications?tab=settings");

    await screen.findByText(/모집 일정/);
    expect(screen.getByLabelText("전체 시작")).toBeEnabled();
    expect(screen.getByRole("button", { name: "+ 문항 추가" })).toBeEnabled();
  });
});
