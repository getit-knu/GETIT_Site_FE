import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMe, logout } from "../../apis/auth/authApi";
import type { Me } from "../../types/auth";

import { AdminLayout } from "./AdminLayout";

vi.mock("../../apis/auth/authApi");

const admin: Me = {
  id: 1,
  email: "admin@getit.com",
  name: "김운영",
  phoneNumber: null,
  college: null,
  major: null,
  studentYear: null,
  studentNumber: null,
  profileImageUrl: null,
  role: "ADMIN",
  generationNo: null,
  status: "ACTIVE",
};

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <p>홈</p> },
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <p>대시보드 본문</p> },
          { path: "questions", element: <p>Q&A 본문</p> },
          { path: "settings", element: <p>설정 본문</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  );

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getMe).mockResolvedValue(admin);
  });

  it("사이드바 메뉴 8개를 보여준다", async () => {
    renderAt("/admin");

    const nav = await screen.findByRole("navigation", { name: "관리자 메뉴" });
    for (const label of [
      "대시보드",
      "지원서 관리",
      "강의 관리",
      "사용자 관리",
      "사이트 관리",
      "Q&A 관리",
      "주식게임 관리",
      "설정",
    ]) {
      expect(within(nav).getByText(label)).toBeInTheDocument();
    }
  });

  it("현재 경로의 메뉴만 활성 표시된다", async () => {
    renderAt("/admin/questions");

    const active = await screen.findByRole("link", { current: "page" });
    expect(active).toHaveTextContent("Q&A 관리");
  });

  it("하위 경로에 있어도 대시보드가 활성으로 남지 않는다", async () => {
    // `/admin` 은 모든 어드민 경로의 접두사다. end 를 빼먹으면 여기서 걸린다.
    renderAt("/admin/settings");

    const active = await screen.findAllByRole("link", { current: "page" });
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveTextContent("설정");
  });

  it("화면이 없는 주식게임 관리는 링크가 아니다", async () => {
    renderAt("/admin");

    await screen.findByText("주식게임 관리");
    expect(screen.queryByRole("link", { name: /주식게임/ })).not.toBeInTheDocument();
  });

  it("로그아웃하면 서버에 알리고 홈으로 보낸다", async () => {
    vi.mocked(logout).mockResolvedValue();
    renderAt("/admin");

    await userEvent.click(await screen.findByRole("button", { name: "로그아웃" }));

    expect(logout).toHaveBeenCalledOnce();
    expect(await screen.findByText("홈")).toBeInTheDocument();
  });

  it("로그아웃 요청이 실패해도 이 브라우저에서는 나간다", async () => {
    // 서버 호출만 믿으면 실패했을 때 사용자는 나갔다고 믿는데 화면은 그대로 남는다.
    vi.mocked(logout).mockRejectedValue(new Error("network"));
    renderAt("/admin");

    await userEvent.click(await screen.findByRole("button", { name: "로그아웃" }));

    expect(await screen.findByText("홈")).toBeInTheDocument();
  });

  it("경로에 따라 Topbar 타이틀이 바뀐다", async () => {
    const { unmount } = renderAt("/admin/questions");
    expect(await screen.findByRole("heading", { name: "Q&A 관리" })).toBeInTheDocument();
    unmount();

    renderAt("/admin/settings");
    expect(await screen.findByRole("heading", { name: "설정" })).toBeInTheDocument();
  });

  it("이름과 역할을 표기하고, 프로필 이미지가 없으면 이니셜을 쓴다", async () => {
    renderAt("/admin");

    expect(await screen.findByText("김운영")).toBeInTheDocument();
    expect(screen.getByText("운영진")).toBeInTheDocument();
    expect(screen.getByText("김")).toBeInTheDocument();
  });
});
