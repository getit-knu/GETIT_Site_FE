import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { logout } from "../../apis/auth/authApi";

import { MemberLayout } from "./MemberLayout";

vi.mock("../../apis/auth/authApi");

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <p>홈</p> },
      {
        path: "/member",
        element: <MemberLayout />,
        children: [{ index: true, element: <p>부원 본문</p> }],
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

describe("MemberLayout", () => {
  it("GETIT 로고 · 본문을 함께 렌더링한다", () => {
    renderAt("/member");

    expect(screen.getByRole("link", { name: "GETIT" })).toBeInTheDocument();
    expect(screen.getByText("부원 본문")).toBeInTheDocument();
  });

  it("강좌 목록 · 대시보드 · 내정보로 가는 링크를 보여준다", () => {
    renderAt("/member");

    const nav = within(screen.getByRole("navigation", { name: "부원 메뉴" }));
    expect(nav.getByRole("link", { name: "강좌 목록", current: "page" })).toHaveAttribute("href", "/member");
    expect(nav.getByRole("link", { name: "대시보드" })).toHaveAttribute("href", "/member/dashboard");
    expect(nav.getByRole("link", { name: "내정보" })).toHaveAttribute("href", "/me");
    expect(nav.queryAllByRole("link")).toHaveLength(4); // GETIT 로고 + 강좌 목록 + 대시보드 + 내정보
  });

  it("로그아웃하면 서버에 알리고 홈으로 보낸다", async () => {
    vi.mocked(logout).mockResolvedValue();
    renderAt("/member");

    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(logout).toHaveBeenCalledOnce();
    expect(await screen.findByText("홈")).toBeInTheDocument();
  });

  it("로그아웃 요청이 실패해도 이 브라우저에서는 나간다", async () => {
    vi.mocked(logout).mockRejectedValue(new Error("network"));
    renderAt("/member");

    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByText("홈")).toBeInTheDocument();
  });
});
