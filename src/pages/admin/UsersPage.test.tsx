import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../../apis/user/usersApi";
import type { AdminUser } from "../../types/user";

import UsersPage from "./UsersPage";

vi.mock("../../apis/user/usersApi");

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
    vi.mocked(api.updateUser).mockResolvedValue();
    vi.mocked(api.deleteUser).mockResolvedValue();
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

  it("합격자 일괄 승격을 호출한다", async () => {
    vi.mocked(api.promoteApplicants).mockResolvedValue(3);
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "합격자 일괄 승격" }));

    expect(api.promoteApplicants).toHaveBeenCalledOnce();
  });

  it("범위를 벗어난 페이지는 '사용자가 없다'고 말하지 않는다", async () => {
    vi.mocked(api.getUsers).mockResolvedValue(
      page([], { page: 99, totalElements: 27, totalPages: 3, first: false, last: true }),
    );

    renderPage("/admin/users?page=99");

    expect(await screen.findByText(/이 페이지에는 사용자가 없습니다/)).toBeInTheDocument();
    expect(screen.queryByText("등록된 사용자가 없습니다.")).not.toBeInTheDocument();
  });
});
