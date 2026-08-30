import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/project/projectsApi";
import type { AdminProject, AdminProjectBoard } from "../../types/project";

import AdminProjectsPage from "./ProjectsPage";

vi.mock("../../apis/project/projectsApi");

function project(over: Partial<AdminProject> = {}): AdminProject {
  return {
    id: 1,
    title: "AI 포트폴리오 추천 시스템",
    teamName: "Team Alpha",
    semester: "2026-FALL",
    description: "투자 성향을 분석해 포트폴리오를 추천한다",
    techStacks: ["Python", "React"],
    codeUrl: "https://github.com/getit-knu/ai-portfolio",
    demoUrl: "https://ai-portfolio.getit-knu.dev",
    fileId: 501,
    thumbnailUrl: "",
    isFeatured: true,
    order: 1,
    ...over,
  };
}

function board(over: Partial<AdminProjectBoard> = {}): AdminProjectBoard {
  return {
    content: [project()],
    page: 0,
    size: 12,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
    ...over,
  };
}

function renderPage(entry = "/admin/projects") {
  const router = createMemoryRouter([{ path: "/admin/projects", element: <AdminProjectsPage /> }], {
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

describe("AdminProjectsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getProjects).mockResolvedValue(board());
    vi.mocked(api.deleteProject).mockResolvedValue();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("목록을 카드로 보여준다", async () => {
    renderPage();

    expect(await screen.findByText("AI 포트폴리오 추천 시스템")).toBeInTheDocument();
    expect(screen.getByText("Team Alpha · 2026-FALL")).toBeInTheDocument();
  });

  it("Home 소개로 표시된 프로젝트는 배지를 보여준다", async () => {
    renderPage();

    expect(await screen.findByText("Home 소개")).toBeInTheDocument();
  });

  it("빈 목록은 안내를 보여준다", async () => {
    vi.mocked(api.getProjects).mockResolvedValue(board({ content: [], totalElements: 0 }));
    renderPage();

    expect(await screen.findByText("등록된 프로젝트가 없습니다.")).toBeInTheDocument();
  });

  it("추가 버튼을 누르면 빈 폼이 열린다", async () => {
    renderPage();
    await screen.findByText("AI 포트폴리오 추천 시스템");

    await userEvent.click(screen.getByRole("button", { name: "+ 프로젝트 추가" }));

    expect(screen.getByRole("heading", { name: "프로젝트 추가" })).toBeInTheDocument();
    expect(screen.getByLabelText("제목 *")).toHaveValue("");
  });

  it("수정을 누르면 목록 행 값으로 폼이 채워진다", async () => {
    renderPage();
    await screen.findByText("AI 포트폴리오 추천 시스템");

    await userEvent.click(screen.getByRole("button", { name: "수정" }));

    expect(screen.getByRole("heading", { name: "프로젝트 수정" })).toBeInTheDocument();
    expect(screen.getByLabelText("제목 *")).toHaveValue("AI 포트폴리오 추천 시스템");
  });

  it("삭제는 확인을 묻고, 확인하면 지운다", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    renderPage();
    await screen.findByText("AI 포트폴리오 추천 시스템");

    await userEvent.click(screen.getByRole("button", { name: "삭제" }));

    await waitFor(() => expect(api.deleteProject).toHaveBeenCalledWith(1));
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(api.getProjects).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
  });
});
