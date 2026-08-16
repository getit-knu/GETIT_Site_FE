import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "../../apis/auth/authApi";
import type { Me, Role } from "../../types/auth";

import { RequireRole } from "./RequireRole";

vi.mock("../../apis/auth/authApi");

const mockedGetMe = vi.mocked(getMe);

function makeUser(role: Role): Me {
  return {
    id: 1,
    email: "a@getit.com",
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

/** `/admin` 에 가드를 걸고, 홈과 403 을 착지 지점으로 둔 최소 라우터. */
function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <p>홈</p> },
      { path: "/403", element: <p>접근 권한이 없습니다</p> },
      {
        path: "/admin",
        element: <RequireRole allowed={["ADMIN"]} />,
        children: [{ index: true, element: <p>어드민 화면</p> }],
      },
    ],
    { initialEntries: [path] },
  );

  // 테스트에서는 재시도를 끈다. 켜 두면 실패 케이스가 타임아웃까지 늘어진다.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("RequireRole", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // 이 프로젝트는 vitest globals 를 켜지 않아 RTL 자동 cleanup 이 걸리지 않는다.
  // 없으면 앞 테스트가 그린 화면이 남아 뒤 테스트가 그걸 보고 통과·실패한다.
  //
  // 같은 내용이 #33(Modal)에서 src/tests/setup.ts 에 전역으로 들어온다.
  // 그쪽이 머지되면 이 줄은 지운다. 지금 setup.ts 를 같이 고치면 #33 과 충돌한다.
  afterEach(() => {
    cleanup();
  });

  it("운영진은 어드민 화면에 들어간다", async () => {
    mockedGetMe.mockResolvedValue(makeUser("ADMIN"));

    renderAt("/admin");

    expect(await screen.findByText("어드민 화면")).toBeInTheDocument();
  });

  it("부원이 어드민에 접근하면 403 으로 보낸다", async () => {
    mockedGetMe.mockResolvedValue(makeUser("MEMBER"));

    renderAt("/admin");

    expect(await screen.findByText("접근 권한이 없습니다")).toBeInTheDocument();
    expect(screen.queryByText("어드민 화면")).not.toBeInTheDocument();
  });

  it("비회원이 어드민에 접근하면 403 으로 보낸다", async () => {
    mockedGetMe.mockResolvedValue(makeUser("GUEST"));

    renderAt("/admin");

    expect(await screen.findByText("접근 권한이 없습니다")).toBeInTheDocument();
  });

  it("로그인하지 않았으면 홈으로 보낸다", async () => {
    mockedGetMe.mockRejectedValue({ code: "UNAUTHORIZED", message: "인증이 필요합니다" });

    renderAt("/admin");

    expect(await screen.findByText("홈")).toBeInTheDocument();
    expect(screen.queryByText("어드민 화면")).not.toBeInTheDocument();
  });

  it("판정 중에는 어느 쪽으로도 보내지 않는다", () => {
    // 응답이 오지 않는 상태. 여기서 리다이렉트하면 새로고침마다 홈이 한 번 스친다.
    mockedGetMe.mockReturnValue(new Promise(() => {}));

    renderAt("/admin");

    expect(screen.queryByText("홈")).not.toBeInTheDocument();
    expect(screen.queryByText("접근 권한이 없습니다")).not.toBeInTheDocument();
    expect(screen.queryByText("어드민 화면")).not.toBeInTheDocument();
  });
});
