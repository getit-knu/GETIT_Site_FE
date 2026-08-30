import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getProjects } from "../apis/public/publicApi";
import type { PublicProject, PublicProjectBoard } from "../types/project";

import ProjectsPage from "./ProjectsPage";

vi.mock("../apis/public/publicApi");

function project(over: Partial<PublicProject> = {}): PublicProject {
  return {
    id: 1,
    title: "AI 포트폴리오 추천 시스템",
    teamName: "Team Alpha",
    semester: "2025-FALL",
    semesterLabel: "2025 Fall",
    description: "투자 성향을 분석해 포트폴리오를 추천한다",
    techStacks: ["Python"],
    codeUrl: "https://github.com/getit-knu/ai-portfolio",
    demoUrl: "https://ai-portfolio.getit-knu.dev",
    thumbnailUrl: null,
    ...over,
  };
}

function board(over: Partial<PublicProjectBoard> = {}): PublicProjectBoard {
  return {
    semesters: ["2025-FALL", "2025-SPRING"],
    content: [project()],
    page: 0,
    size: 9,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
    ...over,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ProjectsPage />
    </QueryClientProvider>,
  );
}

describe("ProjectsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getProjects).mockResolvedValue(board());
  });

  it("헤더와 프로젝트 카드를 렌더링한다", async () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "프로젝트 쇼케이스" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "AI 포트폴리오 추천 시스템", level: 3 })).toBeInTheDocument();
  });

  it("필터 탭을 선택하면 그 학기로 다시 조회한다", async () => {
    renderPage();
    await screen.findByRole("heading", { level: 3 });

    await userEvent.click(screen.getByRole("button", { name: "2025 Fall" }));

    await waitFor(() =>
      expect(getProjects).toHaveBeenCalledWith(expect.objectContaining({ semester: "2025-FALL", page: 0 })),
    );
  });

  it("카드를 클릭하면 상세 모달이 열리고, 닫기를 누르면 닫힌다", async () => {
    renderPage();
    const heading = await screen.findByRole("heading", { name: "AI 포트폴리오 추천 시스템", level: 3 });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(heading);
    expect(screen.getByRole("dialog", { name: "AI 포트폴리오 추천 시스템" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("빈 목록은 안내를 보여준다", async () => {
    vi.mocked(getProjects).mockResolvedValue(board({ content: [], totalElements: 0 }));
    renderPage();

    expect(await screen.findByText("등록된 프로젝트가 없습니다.")).toBeInTheDocument();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(getProjects).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });
});
