import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as groupApi from "../../apis/group/groupsApi";
import * as api from "../../apis/user/usersApi";
import type { AdminUser } from "../../types/user";

import UsersPage from "./UsersPage";

vi.mock("../../apis/user/usersApi");
vi.mock("../../apis/group/groupsApi");

function user(over: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 21,
    name: "김부원",
    email: "member1@example.com",
    college: "경영대학",
    major: "경영학과",
    studentYear: 2,
    role: "GUEST",
    roleLabel: "비회원",
    generationNo: 9,
    group: null,
    status: "ACTIVE",
    ...over,
  };
}

function page(content: AdminUser[], over = {}) {
  return {
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
    ...over,
  };
}

function renderPage(entry = "/admin/users") {
  const router = createMemoryRouter([{ path: "/admin/users", element: <UsersPage /> }], {
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

describe("UsersPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getUsers).mockResolvedValue(page([user()]));
    vi.mocked(api.updateUser).mockResolvedValue(user());
    vi.mocked(api.deleteUser).mockResolvedValue();
    // 사용자 관리 탭의 "조" 열도 실제 조 목록을 쓴다.
    vi.mocked(groupApi.getGroups).mockResolvedValue({
      generationNo: 9,
      groups: [{ id: 1, name: "1조", memberCount: 0, members: [] }],
      unassigned: [],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("목록을 표로 그린다", async () => {
    renderPage();

    const table = await screen.findByRole("table", { name: "사용자 목록" });
    expect(table).toHaveTextContent("김부원");
    expect(table).toHaveTextContent("경영대학 경영학과");
  });

  it("권한을 바꾸면 서버에 보낸다", async () => {
    renderPage();

    await userEvent.selectOptions(await screen.findByRole("combobox", { name: "김부원 권한" }), "MEMBER");

    expect(api.updateUser).toHaveBeenCalledWith(21, { role: "MEMBER" });
  });

  it("조를 미배정으로 바꾸면 groupId 를 null 로 보낸다", async () => {
    // 0 은 화면에서 쓰는 값일 뿐 서버가 아는 조 번호가 아니다.
    vi.mocked(api.getUsers).mockResolvedValue(page([user({ group: { id: 1, name: "1조" } })]));
    renderPage();

    await userEvent.selectOptions(await screen.findByRole("combobox", { name: "김부원 조" }), "0");

    expect(api.updateUser).toHaveBeenCalledWith(21, { groupId: null });
  });

  it("확인을 취소하면 삭제하지 않는다", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "김부원 삭제" }));

    expect(api.deleteUser).not.toHaveBeenCalled();
  });

  it("확인하면 삭제한다", async () => {
    const confirm = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", confirm);
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "김부원 삭제" }));

    // 다른 행을 지우는 실수를 줄이려고 문구에 이름을 넣는다.
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("김부원"));
    expect(api.deleteUser).toHaveBeenCalledWith(21);
  });

  it("권한 탭이 URL 과 조회 조건에 함께 반영된다", async () => {
    const router = renderPage();
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("tab", { name: "부원" }));

    expect(router.state.location.search).toContain("role=MEMBER");
    expect(api.getUsers).toHaveBeenLastCalledWith(expect.objectContaining({ role: "MEMBER" }));
  });

  it("엑셀 다운로드가 실패하면 이유를 보여주고 다시 시도할 수 있다", async () => {
    vi.mocked(api.exportUsers).mockRejectedValue({ code: "FORBIDDEN", message: "권한이 없습니다." });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "엑셀 다운로드" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다.");
  });

  it("일괄 승격은 확인 없이 실행되지 않는다", async () => {
    // 여러 명의 권한을 한 번에 올린다. 한 명 삭제보다 되돌리기 어렵다.
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "합격자 일괄 승격" }));

    expect(api.promoteApplicants).not.toHaveBeenCalled();
  });

  it("확인하면 승격하고 몇 명이 올라갔는지 알린다", async () => {
    // 눌러도 화면이 그대로면 됐는지 알 수 없다.
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(api.promoteApplicants).mockResolvedValue({ promotedCount: 3, skippedCount: 0, skipped: [] });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "합격자 일괄 승격" }));

    expect(api.promoteApplicants).toHaveBeenCalledOnce();
    expect(await screen.findByRole("status")).toHaveTextContent("3명을 부원으로 올렸습니다.");
  });

  it("제외된 인원이 있으면 함께 알린다", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(api.promoteApplicants).mockResolvedValue({
      promotedCount: 3,
      skippedCount: 2,
      skipped: [
        { applicationId: 1, reason: "ALREADY_MEMBER" },
        { applicationId: 2, reason: "USER_WITHDRAWN" },
      ],
    });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "합격자 일괄 승격" }));

    expect(await screen.findByRole("status")).toHaveTextContent("3명을 부원으로 올렸습니다.");
    expect(screen.getByRole("status")).toHaveTextContent("2명 제외");
  });

  it("승격할 대상이 없으면 그렇게 알린다", async () => {
    // "0명을 올렸습니다" 는 성공처럼 읽혀 혼란스럽다.
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(api.promoteApplicants).mockResolvedValue({ promotedCount: 0, skippedCount: 0, skipped: [] });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "합격자 일괄 승격" }));

    expect(await screen.findByRole("status")).toHaveTextContent("승격할 합격자가 없습니다.");
  });

  it("오류 문구를 BE 코드에서 가져온다", async () => {
    vi.mocked(api.getUsers).mockRejectedValue({ code: "FORBIDDEN", message: "서버 원문" });
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("사용자를 볼 권한이 없습니다.");
  });

  it("다운로드 실패는 목록 조회와 다른 문구를 쓴다", async () => {
    vi.mocked(api.exportUsers).mockRejectedValue({ code: "SOMETHING_NEW", message: "?" });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "엑셀 다운로드" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("엑셀 다운로드에 실패했습니다.");
  });

  it("범위를 벗어난 페이지는 '사용자가 없다'고 말하지 않는다", async () => {
    vi.mocked(api.getUsers).mockResolvedValue(
      page([], { page: 99, totalElements: 27, totalPages: 3, first: false, last: true }),
    );

    renderPage("/admin/users?page=99");

    expect(await screen.findByText(/이 페이지에는 사용자가 없습니다/)).toBeInTheDocument();
    expect(screen.queryByText("등록된 사용자가 없습니다.")).not.toBeInTheDocument();
  });

  it("기본은 사용자 관리 탭이다", async () => {
    renderPage();

    expect(await screen.findByRole("table", { name: "사용자 목록" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "사용자 관리" })).toHaveAttribute("aria-selected", "true");
  });

  it("탭을 바꾸면 URL 에 남고 그룹 관리가 나온다", async () => {
    vi.mocked(groupApi.getGroups).mockResolvedValue({
      generationNo: 9,
      groups: [{ id: 1, name: "1조", memberCount: 0, members: [] }],
      unassigned: [],
    });
    const router = renderPage();
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("tab", { name: "그룹 관리" }));

    expect(router.state.location.search).toContain("tab=groups");
    expect(await screen.findByRole("heading", { name: /1조/ })).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "사용자 목록" })).not.toBeInTheDocument();
  });

  it("URL 에 적힌 탭으로 시작한다", async () => {
    // 새로고침하거나 링크를 받아 들어와도 보던 탭이 유지돼야 한다.
    vi.mocked(groupApi.getGroups).mockResolvedValue({
      generationNo: 9,
      groups: [],
      unassigned: [],
    });

    renderPage("/admin/users?tab=groups");

    expect(await screen.findByText("아직 만든 조가 없습니다.")).toBeInTheDocument();
  });

  it("허용 목록에 없는 탭은 기본 탭으로 본다", async () => {
    renderPage("/admin/users?tab=DROP");

    expect(await screen.findByRole("table", { name: "사용자 목록" })).toBeInTheDocument();
  });
});
