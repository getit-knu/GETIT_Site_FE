import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getForm, getMyApplication, getResult } from "../apis/application/myApplicationApi";
import { getRecruitmentStatus } from "../apis/public/publicApi";
import type { ApplicationDecisionResult, MyApplicationResult } from "../types/application";
import type { RecruitmentStatus } from "../types/recruitment";

import ApplyPage from "./ApplyPage";

vi.mock("../apis/application/myApplicationApi");
vi.mock("../apis/public/publicApi");

function myApplication(over: Partial<MyApplicationResult> = {}): MyApplicationResult {
  return {
    id: 1,
    generationNo: 9,
    status: "SUBMITTED",
    basicInfo: {
      name: "김부원",
      email: "kim@getit.com",
      phoneNumber: "010-1234-5678",
      collegeId: 2,
      majorId: 2,
      grade: 3,
      studentNumber: "2021123456",
    },
    answers: [{ questionId: 1, answerText: "이미 써둔 동기입니다.", selectedOptions: null }],
    savedAt: "2026-09-01T00:00:00+09:00",
    submittedAt: "2026-09-01T00:00:00+09:00",
    ...over,
  };
}

function decision(over: Partial<ApplicationDecisionResult> = {}): ApplicationDecisionResult {
  return {
    generationNo: 9,
    status: "SUBMITTED",
    statusLabel: "심사 중",
    documentAnnouncedAt: "2026-09-15T00:00:00+09:00",
    finalAnnouncedAt: "2026-09-30T00:00:00+09:00",
    nextStep: null,
    ...over,
  };
}

function recruitmentStatus(over: Partial<RecruitmentStatus> = {}): RecruitmentStatus {
  return {
    generationNo: 9,
    year: 2026,
    phase: "DOCUMENT_OPEN",
    dDay: 5,
    message: "",
    applyEnabled: true,
    schedule: null,
    ...over,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/apply", element: <ApplyPage /> },
      { path: "/login", element: <p>로그인 페이지</p> },
    ],
    { initialEntries: ["/apply"] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("ApplyPage - 결과 화면", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getRecruitmentStatus).mockResolvedValue(recruitmentStatus());
    vi.mocked(getMyApplication).mockResolvedValue(myApplication());
    vi.mocked(getResult).mockResolvedValue(decision());
  });

  it("이미 제출된 지원서는 폼 대신 결과 화면을 보여준다", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "심사 중" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "지원서 작성" })).not.toBeInTheDocument();
    expect(getForm).not.toHaveBeenCalled();
  });

  it("발표 시각을 프로젝트 공용 포맷(초 없이, 한국 시간)으로 보여준다", async () => {
    // 예전엔 new Date().toLocaleString()을 그대로 써서 브라우저 로캘·시간대에 따라
    // 초까지 나오는 등 사람마다 다르게 보였다(0831 QA).
    renderPage();

    expect(await screen.findByText("서류 발표: 2026. 09. 15. 00:00")).toBeInTheDocument();
    expect(screen.getByText("최종 발표: 2026. 09. 30. 00:00")).toBeInTheDocument();
  });

  it("서류 합격이면 다음 단계 안내(면접)를 함께 보여준다", async () => {
    vi.mocked(getMyApplication).mockResolvedValue(myApplication({ status: "DOC_PASS" }));
    vi.mocked(getResult).mockResolvedValue(
      decision({
        status: "DOC_PASS",
        statusLabel: "서류 합격",
        nextStep: {
          type: "INTERVIEW",
          message: "면접 일정은 개별 안내드립니다.",
          periodStart: "2026-10-01",
          periodEnd: "2026-10-05",
        },
      }),
    );
    renderPage();

    expect(await screen.findByRole("heading", { name: "서류 합격" })).toBeInTheDocument();
    expect(screen.getByText("면접 일정은 개별 안내드립니다.")).toBeInTheDocument();
    expect(screen.getByText(/2026-10-01/)).toBeInTheDocument();
  });
});
