import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as groupApi from "../../apis/group/groupsApi";
import * as api from "../../apis/user/usersApi";
import type { AdminUser } from "../../types/user";

import UsersPage from "./UsersPage";

vi.mock("../../apis/user/usersApi");
vi.mock("../../apis/group/groupsApi");

/**
 * 탈퇴한 사용자 숨김(#277). `UsersPage.test.tsx`가 300줄을 넘지 않도록 떼어 뒀다
 * (`ApplyPage.result.test.tsx`와 같은 방식).
 */

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

describe("UsersPage - 탈퇴한 사용자", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.updateUser).mockResolvedValue(user());
    vi.mocked(api.deleteUser).mockResolvedValue();
    vi.mocked(groupApi.getGroups).mockResolvedValue({
      generationNo: 9,
      groups: [{ id: 1, name: "1조", memberCount: 0, members: [] }],
      unassigned: [],
    });
  });

  // 소프트 삭제라 지운 사용자가 WITHDRAWN 으로 계속 내려온다(#277).
  function withdrawnInTheMiddle() {
    return page([
      user({ id: 1, name: "첫부원", email: "a@example.com" }),
      user({ id: 2, name: "탈퇴부원", email: "b@example.com", status: "WITHDRAWN" }),
      user({ id: 3, name: "끝부원", email: "c@example.com" }),
    ]);
  }

  it("기본으로 목록에서 숨긴다", async () => {
    vi.mocked(api.getUsers).mockResolvedValue(withdrawnInTheMiddle());
    renderPage();

    const table = await screen.findByRole("table", { name: "사용자 목록" });
    expect(table).toHaveTextContent("첫부원");
    expect(table).toHaveTextContent("끝부원");
    expect(table).not.toHaveTextContent("탈퇴부원");
  });

  it("몇 명을 숨겼는지 알린다", async () => {
    // 표가 짧아진 이유를 말하지 않으면 목록이 잘린 것처럼 읽힌다.
    vi.mocked(api.getUsers).mockResolvedValue(withdrawnInTheMiddle());
    renderPage();

    expect(await screen.findByText("탈퇴한 사용자 1명을 숨겼습니다.", { exact: false })).toBeInTheDocument();
  });

  it("보기를 켜면 다시 나오고 URL 에 남는다", async () => {
    vi.mocked(api.getUsers).mockResolvedValue(withdrawnInTheMiddle());
    const router = renderPage();
    await screen.findByRole("table");

    await userEvent.click(screen.getByRole("checkbox", { name: "탈퇴한 사용자 보기" }));

    expect(router.state.location.search).toContain("withdrawn=1");
    expect(screen.getByRole("table", { name: "사용자 목록" })).toHaveTextContent("탈퇴부원");
  });

  it("보기를 켜면 첫 페이지로 되돌린다", async () => {
    // 보이는 인원이 달라지므로 필터를 바꿀 때와 같은 이유로 되돌린다.
    vi.mocked(api.getUsers).mockResolvedValue(
      page([user({ status: "WITHDRAWN" })], { page: 2, totalElements: 27, totalPages: 3 }),
    );
    const router = renderPage("/admin/users?page=2");
    await screen.findByRole("button", { name: "탈퇴한 사용자 보기" });

    await userEvent.click(screen.getByRole("checkbox", { name: "탈퇴한 사용자 보기" }));

    expect(router.state.location.search).not.toContain("page=");
  });

  it("탈퇴한 사용자에게는 삭제 버튼을 두지 않는다", async () => {
    // 이미 지운 사용자다. 눌러도 아무 일이 없을 버튼을 두지 않는다.
    vi.mocked(api.getUsers).mockResolvedValue(withdrawnInTheMiddle());
    renderPage("/admin/users?withdrawn=1");

    await screen.findByRole("table");
    expect(screen.getByRole("button", { name: "첫부원 삭제" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "탈퇴부원 삭제" })).not.toBeInTheDocument();
  });

  it("탈퇴자만 있는 페이지를 '등록된 사용자가 없다'고 하지 않는다", async () => {
    vi.mocked(api.getUsers).mockResolvedValue(page([user({ status: "WITHDRAWN" })]));
    renderPage();

    expect(await screen.findByText("이 페이지의 사용자 1명은 모두 탈퇴했습니다.")).toBeInTheDocument();
    expect(screen.queryByText("등록된 사용자가 없습니다.")).not.toBeInTheDocument();
  });
});
