import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMe, logout } from "../../apis/auth/authApi";
import type { Me, Role } from "../../types/auth";

import { Nav } from "./Nav";

vi.mock("../../apis/auth/authApi");

function meWithRole(role: Role): Me {
  return {
    id: 1,
    email: "user@getit.com",
    name: "김부원",
    phoneNumber: null,
    college: null,
    major: null,
    studentYear: null,
    studentNumber: null,
    profileImageUrl: null,
    role,
    generationNo: null,
    status: "ACTIVE",
  };
}

/** 링크를 눌러 실제로 이동해도 라우트가 있어야 Nav가 언마운트되지 않는다. */
function renderNav() {
  const router = createMemoryRouter(
    ["/", "/projects", "/leaders", "/login", "/member", "/admin", "/apply"].map((path) => ({
      path,
      element: <Nav />,
    })),
    { initialEntries: ["/"] },
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("Nav", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("메뉴 버튼은 처음엔 닫힌 상태다", () => {
    vi.mocked(getMe).mockRejectedValue({ code: "UNAUTHORIZED", message: "인증이 필요합니다." });
    renderNav();

    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute("aria-expanded", "false");
  });

  it("버튼을 누르면 메뉴가 열리고 라벨이 바뀐다", async () => {
    vi.mocked(getMe).mockRejectedValue({ code: "UNAUTHORIZED", message: "인증이 필요합니다." });
    renderNav();

    await userEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));

    expect(screen.getByRole("button", { name: "메뉴 닫기" })).toHaveAttribute("aria-expanded", "true");
  });

  it("다시 누르면 닫힌다", async () => {
    vi.mocked(getMe).mockRejectedValue({ code: "UNAUTHORIZED", message: "인증이 필요합니다." });
    renderNav();

    const toggle = screen.getByRole("button", { name: "메뉴 열기" });
    await userEvent.click(toggle);
    await userEvent.click(screen.getByRole("button", { name: "메뉴 닫기" }));

    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute("aria-expanded", "false");
  });

  it("링크를 누르면 메뉴가 닫힌다", async () => {
    vi.mocked(getMe).mockRejectedValue({ code: "UNAUTHORIZED", message: "인증이 필요합니다." });
    renderNav();

    await userEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
    await userEvent.click(screen.getByRole("link", { name: "프로젝트" }));

    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute("aria-expanded", "false");
  });

  it("로그인 전에는 로그인 링크만 보이고 역할별 링크·로그아웃은 없다", async () => {
    vi.mocked(getMe).mockRejectedValue({ code: "UNAUTHORIZED", message: "인증이 필요합니다." });
    renderNav();

    expect(await screen.findByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
  });

  it("ADMIN으로 로그인하면 관리자 페이지 링크와 로그아웃이 보이고 로그인 링크는 없다", async () => {
    vi.mocked(getMe).mockResolvedValue(meWithRole("ADMIN"));
    renderNav();

    expect(await screen.findByRole("link", { name: "관리자 페이지" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "로그인" })).not.toBeInTheDocument();
  });

  it("MEMBER로 로그인하면 부원 페이지 링크가 보인다", async () => {
    vi.mocked(getMe).mockResolvedValue(meWithRole("MEMBER"));
    renderNav();

    expect(await screen.findByRole("link", { name: "부원 페이지" })).toHaveAttribute("href", "/member");
  });

  it("GUEST로 로그인하면 갈 곳이 없어 로그아웃만 보인다", async () => {
    vi.mocked(getMe).mockResolvedValue(meWithRole("GUEST"));
    renderNav();

    expect(await screen.findByRole("button", { name: "로그아웃" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "관리자 페이지" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "부원 페이지" })).not.toBeInTheDocument();
  });

  it("로그아웃을 누르면 서버에 알리고 로그인 상태가 풀린다", async () => {
    vi.mocked(getMe).mockResolvedValue(meWithRole("ADMIN"));
    // 로그아웃 이후엔 토큰이 없어 `getMe`도 다시 인증 필요로 응답한다.
    vi.mocked(logout).mockImplementation(async () => {
      vi.mocked(getMe).mockRejectedValue({ code: "UNAUTHORIZED", message: "인증이 필요합니다." });
    });
    renderNav();

    await userEvent.click(await screen.findByRole("button", { name: "로그아웃" }));

    expect(logout).toHaveBeenCalledOnce();
    expect(await screen.findByRole("link", { name: "로그인" })).toBeInTheDocument();
  });
});
