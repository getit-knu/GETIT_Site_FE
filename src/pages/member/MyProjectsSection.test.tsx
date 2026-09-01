import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyProjects } from "../../apis/project/memberProjectsApi";
import type { MemberProject } from "../../types/project";

import { MyProjectsSection } from "./MyProjectsSection";

vi.mock("../../apis/project/memberProjectsApi");

function project(over: Partial<MemberProject> = {}): MemberProject {
  return {
    id: 1,
    title: "AI 포트폴리오",
    teamName: "1조",
    semester: "2026-FALL",
    description: "설명",
    techStacks: ["Python"],
    codeUrl: "",
    demoUrl: "",
    fileId: 501,
    thumbnailUrl: "",
    status: "PENDING",
    statusLabel: "승인 대기",
    rejectReason: null,
    ...over,
  };
}

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MyProjectsSection />
    </QueryClientProvider>,
  );
}

describe("MyProjectsSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("아직 낸 것이 없으면 아무것도 보여주지 않는다", async () => {
    // 빈 목록 안내보다, 바로 아래 있는 등록 폼이 할 일을 대신 말해준다.
    vi.mocked(getMyProjects).mockResolvedValue([]);
    const { container } = renderSection();

    await vi.waitFor(() => expect(container).not.toHaveTextContent("불러오는 중"));
    expect(container).toBeEmptyDOMElement();
  });

  it("낸 프로젝트의 제목 · 학기 · 상태를 보여준다", async () => {
    vi.mocked(getMyProjects).mockResolvedValue([project()]);
    renderSection();

    expect(await screen.findByText("AI 포트폴리오")).toBeInTheDocument();
    expect(screen.getByText("2026-FALL")).toBeInTheDocument();
    expect(screen.getByText("승인 대기")).toBeInTheDocument();
  });

  it("반려됐으면 반려 사유를 보여준다", async () => {
    vi.mocked(getMyProjects).mockResolvedValue([
      project({ status: "REJECTED", statusLabel: "반려", rejectReason: "팀명이 부적절합니다." }),
    ]);
    renderSection();

    expect(await screen.findByText("반려", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("반려 사유: 팀명이 부적절합니다.")).toBeInTheDocument();
  });

  it("반려된 적 없으면 반려 사유를 보여주지 않는다", async () => {
    vi.mocked(getMyProjects).mockResolvedValue([project()]);
    renderSection();

    await screen.findByText("AI 포트폴리오");
    expect(screen.queryByText(/반려 사유/)).not.toBeInTheDocument();
  });

  it("여러 건이면 전부 보여준다", async () => {
    // 조 명의라 낸 사람이 아니어도 같은 조원의 것까지 함께 보인다.
    vi.mocked(getMyProjects).mockResolvedValue([
      project({ id: 1, title: "첫 번째" }),
      project({ id: 2, title: "두 번째", status: "APPROVED", statusLabel: "공개" }),
    ]);
    renderSection();

    expect(await screen.findByText("첫 번째")).toBeInTheDocument();
    expect(screen.getByText("두 번째")).toBeInTheDocument();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(getMyProjects).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderSection();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
