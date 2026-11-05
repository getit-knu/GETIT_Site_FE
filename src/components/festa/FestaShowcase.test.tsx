import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getProjects } from "../../apis/public/publicApi";
import type { PublicProject, PublicProjectBoard } from "../../types/project";

import { FestaShowcase } from "./FestaShowcase";

vi.mock("../../apis/public/publicApi");

function project(id: number, semester: string): PublicProject {
  return {
    id,
    title: `프로젝트 ${id}`,
    teamName: `TEAM ${id}`,
    semester,
    semesterLabel: semester === "2026-FALL" ? "2026 Fall" : "2026 Spring",
    description: `설명 ${id}`,
    techStacks: ["React"],
    codeUrl: "https://github.com/getit-knu",
    demoUrl: "https://getit.example.com",
    thumbnailUrl: null,
  };
}

function board(content: PublicProject[], semesters: string[]): PublicProjectBoard {
  return {
    content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
    semesters,
  };
}

function renderShowcase() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FestaShowcase />
    </QueryClientProvider>,
  );
}

describe("FestaShowcase", () => {
  beforeEach(() => {
    vi.mocked(getProjects).mockReset();
  });

  it("가장 최근 학기의 프로젝트만 다시 불러와 카드로 보여준다", async () => {
    const fall = [project(1, "2026-FALL"), project(2, "2026-FALL")];
    vi.mocked(getProjects).mockImplementation((params) =>
      Promise.resolve(
        params.semester === "2026-FALL"
          ? board(fall, ["2026-SPRING", "2026-FALL"])
          : board([project(9, "2026-SPRING")], ["2026-SPRING", "2026-FALL"]),
      ),
    );
    renderShowcase();

    expect(await screen.findByRole("heading", { name: "프로젝트 1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "프로젝트 2" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "프로젝트 9" })).not.toBeInTheDocument();
    expect(getProjects).toHaveBeenCalledWith({ semester: "2026-FALL", size: 20 });
    expect(screen.getByText("GET IT 2026 Fall · 프로젝트 쇼케이스")).toBeInTheDocument();
    expect(screen.getByText(/2팀 출전/)).toBeInTheDocument();
  });

  it("카드의 자세히 보기를 누르면 그 프로젝트 상세가 열린다", async () => {
    vi.mocked(getProjects).mockResolvedValue(board([project(1, "2026-FALL")], ["2026-FALL"]));
    renderShowcase();

    fireEvent.click(await screen.findByRole("button", { name: "프로젝트 1 자세히 보기" }));

    expect(screen.getByRole("dialog", { name: "프로젝트 1" })).toBeInTheDocument();
  });

  it("공개된 학기가 하나도 없으면 준비 중 안내를 보여준다", async () => {
    vi.mocked(getProjects).mockResolvedValue(board([], []));
    renderShowcase();

    expect(await screen.findByText("출전 프로젝트를 준비하고 있어요.")).toBeInTheDocument();
    expect(getProjects).toHaveBeenCalledTimes(1);
  });

  it("불러오기에 실패하면 안내를 보여준다", async () => {
    vi.mocked(getProjects).mockRejectedValue(new Error("network"));
    renderShowcase();

    expect(await screen.findByRole("alert")).toHaveTextContent("프로젝트를 불러오지 못했어요.");
  });
});
