import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getHome } from "../../apis/public/publicApi";
import type { HomeResult } from "../../types/home";

import { CurriculumTimeline } from "./CurriculumTimeline";

vi.mock("../../apis/public/publicApi");

function home(over: Partial<HomeResult> = {}): HomeResult {
  return {
    curriculums: [
      { id: 1, order: 1, title: "GETIT Chat", subtitle: "" },
      { id: 2, order: 2, title: "SW 교육", subtitle: "실무 중심 커리큘럼" },
    ],
    featuredProjects: [],
    features: { stockGame: false, mockInvestment: false },
    ...over,
  };
}

function renderTimeline() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CurriculumTimeline />
    </QueryClientProvider>,
  );
}

describe("CurriculumTimeline", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getHome).mockResolvedValue(home());
  });

  it("제목과 커리큘럼 항목을 order 순으로 보여준다", async () => {
    renderTimeline();

    expect(await screen.findByRole("heading", { name: "커리큘럼" })).toBeInTheDocument();
    expect(screen.getByText("GETIT Chat")).toBeInTheDocument();
    expect(screen.getByText("SW 교육")).toBeInTheDocument();
    expect(screen.getByText("실무 중심 커리큘럼")).toBeInTheDocument();
  });

  it("subtitle이 비어 있으면 그 줄을 그리지 않는다", async () => {
    renderTimeline();

    await screen.findByText("GETIT Chat");
    // 첫 항목은 subtitle이 빈 문자열이라 별도 문단이 없어야 한다.
    expect(screen.queryByText("", { selector: "p" })).not.toBeInTheDocument();
  });

  it("커리큘럼이 없으면 아무것도 그리지 않는다", async () => {
    vi.mocked(getHome).mockResolvedValue(home({ curriculums: [] }));
    const { container } = renderTimeline();

    await vi.waitFor(() => expect(getHome).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
