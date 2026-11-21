import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "../../apis/auth/authApi";
import { getFestaProjects } from "../../apis/public/publicApi";
import type { PublicProject } from "../../types/project";
import { NO_PROJECT_DETAILS } from "../../mocks/projectDetails";

import { FestaShowcase } from "./FestaShowcase";

vi.mock("../../apis/auth/authApi");
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
    ...NO_PROJECT_DETAILS,
    galleryImageUrls: [],
  };
}

function renderShowcase(generationNo: number | null = 9) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FestaShowcase generationNo={generationNo} />
    </QueryClientProvider>,
  );
}

describe("FestaShowcase", () => {
  beforeEach(() => {
    vi.mocked(getFestaProjects).mockReset();
    // 투자 패널은 로그인 여부로 갈린다 — 여기 테스트는 비로그인으로 본다(투자는 FestaShowcase.invest.test).
    vi.mocked(getMe).mockRejectedValue({ code: "UNAUTHORIZED", message: "" });
  });

  it("어드민이 고른 출전 프로젝트를 받은 순서대로 카드로 보여준다", async () => {
    vi.mocked(getFestaProjects).mockResolvedValue([project(2, "2026-FALL"), project(1, "2026-FALL")]);
    renderShowcase();

    const headings = await screen.findAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(["프로젝트 2", "프로젝트 1"]);
    // 계절 대신 기수를 띄운다(#377).
    expect(screen.getByText("GET IT 9기 프로젝트 쇼케이스")).toBeInTheDocument();
    expect(screen.getByText(/2팀 출전/)).toBeInTheDocument();
  });

  it("카드의 자세히 보기를 누르면 그 프로젝트 상세가 열린다", async () => {
    vi.mocked(getFestaProjects).mockResolvedValue([project(1, "2026-FALL")]);
    renderShowcase();

    fireEvent.click(await screen.findByRole("button", { name: "프로젝트 1 자세히 보기" }));

    expect(screen.getByRole("dialog", { name: "프로젝트 1" })).toBeInTheDocument();
  });

  it("출전 프로젝트가 없으면 준비 중 안내를 보여준다", async () => {
    vi.mocked(getFestaProjects).mockResolvedValue([]);
    renderShowcase();

    expect(await screen.findByText("출전 프로젝트를 준비하고 있어요.")).toBeInTheDocument();
  });

  it("활성 기수가 없으면 배지에서 기수를 뺀다", async () => {
    vi.mocked(getFestaProjects).mockResolvedValue([]);
    renderShowcase(null);

    await screen.findByText("출전 프로젝트를 준비하고 있어요.");
    expect(screen.getByText("GET IT 프로젝트 쇼케이스")).toBeInTheDocument();
  });

  it("불러오기에 실패하면 안내를 보여준다", async () => {
    vi.mocked(getFestaProjects).mockRejectedValue(new Error("network"));
    renderShowcase();

    expect(await screen.findByRole("alert")).toHaveTextContent("프로젝트를 불러오지 못했어요.");
  });
});
