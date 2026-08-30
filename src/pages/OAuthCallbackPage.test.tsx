import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMe, refreshAccessToken } from "../apis/auth/authApi";
import type { Me, Role } from "../types/auth";

import OAuthCallbackPage from "./OAuthCallbackPage";

vi.mock("../apis/auth/authApi");

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

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <p>홈</p> },
      { path: "/member", element: <p>부원 본문</p> },
      { path: "/admin", element: <p>관리자 본문</p> },
      { path: "/oauth/callback", element: <OAuthCallbackPage /> },
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

describe("OAuthCallbackPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(refreshAccessToken).mockResolvedValue({ accessToken: "token", accessTokenExpiresIn: 3600 });
  });

  it("ADMIN이면 관리자 페이지로 보낸다", async () => {
    vi.mocked(getMe).mockResolvedValue(meWithRole("ADMIN"));
    renderAt("/oauth/callback");

    expect(await screen.findByText("관리자 본문")).toBeInTheDocument();
  });

  it("MEMBER면 부원 페이지로 보낸다", async () => {
    vi.mocked(getMe).mockResolvedValue(meWithRole("MEMBER"));
    renderAt("/oauth/callback");

    expect(await screen.findByText("부원 본문")).toBeInTheDocument();
  });

  it("GUEST는 아직 갈 곳이 없어 홈으로 보낸다", async () => {
    vi.mocked(getMe).mockResolvedValue(meWithRole("GUEST"));
    renderAt("/oauth/callback?isNewUser=true");

    expect(await screen.findByText("홈")).toBeInTheDocument();
  });

  it("토큰 재발급에 실패하면 실패 화면을 보여주고, 홈으로 버튼이 동작한다", async () => {
    vi.mocked(refreshAccessToken).mockRejectedValue(new Error("network"));
    renderAt("/oauth/callback");

    expect(await screen.findByText("로그인에 실패했습니다")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "홈으로" }));
    expect(await screen.findByText("홈")).toBeInTheDocument();
  });
});
