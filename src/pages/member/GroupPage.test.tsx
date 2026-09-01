import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyGroup } from "../../apis/group/memberGroupApi";
import { getMyProjects, submitProject } from "../../apis/project/memberProjectsApi";
import type { Group } from "../../types/group";
import type { MemberProject } from "../../types/project";

import GroupPage from "./GroupPage";

vi.mock("../../apis/group/memberGroupApi");
vi.mock("../../apis/project/memberProjectsApi");

function project(over: Partial<MemberProject> = {}): MemberProject {
  return {
    id: 1,
    title: "새 프로젝트",
    teamName: "1조",
    semester: "2026-FALL",
    description: "",
    techStacks: [],
    codeUrl: "",
    demoUrl: "",
    fileId: 0,
    thumbnailUrl: "",
    status: "PENDING",
    statusLabel: "승인 대기",
    rejectReason: null,
    ...over,
  };
}

function group(over: Partial<Group> = {}): Group {
  return {
    id: 1,
    name: "1조",
    memberCount: 2,
    members: [
      { userId: 1, name: "김부원", major: "경영학과", role: "MEMBER", roleLabel: "부원" },
      { userId: 2, name: "이부원", major: "컴퓨터공학과", role: "MEMBER", roleLabel: "부원" },
    ],
    ...over,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <GroupPage />
    </QueryClientProvider>,
  );
}

describe("GroupPage", () => {
  beforeEach(() => {
    vi.mocked(getMyProjects).mockResolvedValue([]);
  });

  it("내 조 이름 · 인원수 · 조원 목록을 보여준다", async () => {
    vi.mocked(getMyGroup).mockResolvedValue(group());
    renderPage();

    expect(await screen.findByRole("heading", { name: "1조" })).toBeInTheDocument();
    expect(screen.getByText("2명")).toBeInTheDocument();
    expect(screen.getByText("김부원")).toBeInTheDocument();
    expect(screen.getByText(/경영학과 · 부원/)).toBeInTheDocument();
  });

  it("조가 배정되지 않았으면(data: null) 안내만 보여주고 등록 폼은 없다", async () => {
    vi.mocked(getMyGroup).mockResolvedValue(null);
    renderPage();

    expect(await screen.findByText(/아직 배정된 조가 없습니다/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "프로젝트 등록" })).not.toBeInTheDocument();
  });

  it("조가 있으면 프로젝트 등록 폼을 함께 보여준다", async () => {
    vi.mocked(getMyGroup).mockResolvedValue(group());
    renderPage();

    expect(await screen.findByRole("button", { name: "프로젝트 등록" })).toBeInTheDocument();
  });

  it("조회에 실패하면 오류와 재시도를 보여준다", async () => {
    vi.mocked(getMyGroup).mockRejectedValue({ code: "FORBIDDEN", message: "?" });
    renderPage();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("프로젝트를 등록하면 '우리 조가 낸 프로젝트' 목록을 다시 불러와 곧바로 보여준다", async () => {
    // 등록해도 결과를 다시 볼 방법이 없던 것을 고친다(#296) — 새로고침 없이 반영돼야 한다.
    vi.mocked(getMyGroup).mockResolvedValue(group());
    vi.mocked(submitProject).mockImplementation(async () => {
      vi.mocked(getMyProjects).mockResolvedValue([project()]);
      return project();
    });
    renderPage();

    await screen.findByRole("button", { name: "프로젝트 등록" });
    expect(screen.queryByText("새 프로젝트")).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("제목 *"), "새 프로젝트");
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 등록" }));

    await waitFor(() => expect(submitProject).toHaveBeenCalled());
    expect(await screen.findByText("새 프로젝트", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("승인 대기")).toBeInTheDocument();
  });
});
