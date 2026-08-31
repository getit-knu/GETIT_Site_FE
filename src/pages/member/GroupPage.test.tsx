import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getMyGroup } from "../../apis/group/memberGroupApi";
import type { Group } from "../../types/group";

import GroupPage from "./GroupPage";

vi.mock("../../apis/group/memberGroupApi");

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
});
