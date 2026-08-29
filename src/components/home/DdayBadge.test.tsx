import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { getRecruitmentStatus } from "../../apis/public/publicApi";
import type { RecruitmentStatus } from "../../types/recruitment";

import { DdayBadge } from "./DdayBadge";

vi.mock("../../apis/public/publicApi");

const SCHEDULE = {
  totalStartAt: "2026-09-01T00:00",
  totalEndAt: "2026-09-30T23:59",
  documentStartAt: "2026-09-01T00:00",
  documentEndAt: "2026-09-10T23:59",
  interviewStartAt: "2026-09-15T00:00",
  interviewEndAt: "2026-09-30T23:59",
};

function status(overrides: Partial<RecruitmentStatus>): RecruitmentStatus {
  return {
    generationNo: 9,
    year: 2026,
    phase: "DOCUMENT_OPEN",
    dDay: 2,
    message: "",
    applyEnabled: true,
    schedule: SCHEDULE,
    ...overrides,
  };
}

function renderBadge() {
  const router = createMemoryRouter([{ path: "/", element: <DdayBadge /> }], { initialEntries: ["/"] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("DdayBadge", () => {
  it("applyEnabled가 false면 아무것도 보여주지 않는다", async () => {
    vi.mocked(getRecruitmentStatus).mockResolvedValue(status({ applyEnabled: false, phase: "BEFORE_OPEN" }));
    renderBadge();

    await vi.waitFor(() => expect(getRecruitmentStatus).toHaveBeenCalled());
    expect(screen.queryByText("지원하기")).not.toBeInTheDocument();
  });

  it("applyEnabled가 true면 남은 일수와 함께 지원하기 링크를 보여준다", async () => {
    vi.mocked(getRecruitmentStatus).mockResolvedValue(status({ dDay: 2 }));
    renderBadge();

    expect(await screen.findByText("D-2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /지원하기/ })).toHaveAttribute("href", "/apply");
  });

  it("dDay가 0이면 D-DAY로 보여준다", async () => {
    vi.mocked(getRecruitmentStatus).mockResolvedValue(status({ dDay: 0 }));
    renderBadge();

    expect(await screen.findByText("D-DAY")).toBeInTheDocument();
  });
});
