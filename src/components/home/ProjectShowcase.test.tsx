import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getHome } from "../../apis/public/publicApi";
import type { HomeResult } from "../../types/home";

import { ProjectShowcase } from "./ProjectShowcase";

vi.mock("../../apis/public/publicApi");

function home(over: Partial<HomeResult> = {}): HomeResult {
  return {
    curriculums: [],
    featuredProjects: [
      {
        id: 1,
        title: "주식 포트폴리오 추천 시스템",
        description: "AI 기반 맞춤형 포트폴리오 추천",
        thumbnailUrl: null,
      },
      { id: 2, title: "암호화폐 트레이딩 봇", description: "자동화된 거래 시스템 구축", thumbnailUrl: null },
    ],
    features: { stockGame: false, mockInvestment: false },
    ...over,
  };
}

function renderShowcase() {
  const router = createMemoryRouter([{ path: "/", element: <ProjectShowcase /> }], { initialEntries: ["/"] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("ProjectShowcase", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getHome).mockResolvedValue(home());
  });

  it("제목과 소개된 프로젝트를 보여준다", async () => {
    renderShowcase();

    expect(await screen.findByRole("heading", { name: "프로젝트 쇼케이스" })).toBeInTheDocument();
    for (const title of ["주식 포트폴리오 추천 시스템", "암호화폐 트레이딩 봇"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("모든 프로젝트 보기가 프로젝트 목록으로 이동하는 링크다", async () => {
    renderShowcase();

    expect(await screen.findByRole("link", { name: "모든 프로젝트 보기" })).toHaveAttribute("href", "/projects");
  });

  it("소개된 프로젝트가 없으면 아무것도 그리지 않는다", async () => {
    vi.mocked(getHome).mockResolvedValue(home({ featuredProjects: [] }));
    const { container } = renderShowcase();

    await vi.waitFor(() => expect(getHome).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
