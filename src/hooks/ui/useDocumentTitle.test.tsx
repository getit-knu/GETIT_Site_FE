import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Link, Outlet, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { useDocumentTitle } from "./useDocumentTitle";

function Root() {
  useDocumentTitle();
  return <Outlet />;
}

/** `routes.tsx` 와 같은 모양 — 경로 없는 루트가 전체를 감싸고, 제목은 `handle` 로 온다. */
function renderAt(initial: string, children: Parameters<typeof createMemoryRouter>[0]) {
  const router = createMemoryRouter([{ Component: Root, children }], { initialEntries: [initial] });
  return render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

beforeEach(() => {
  document.title = "";
});

describe("useDocumentTitle", () => {
  it("열린 라우트의 제목을 탭에 쓴다", async () => {
    renderAt("/projects", [{ path: "/projects", handle: { title: "프로젝트 쇼케이스 · GET IT" }, element: <p /> }]);

    await waitFor(() => expect(document.title).toBe("프로젝트 쇼케이스 · GET IT"));
  });

  it("이동하면 제목도 따라 바뀐다", async () => {
    // 이게 안 되면 SPA 에서는 첫 화면 제목이 탭에 그대로 굳는다.
    renderAt("/", [
      { path: "/", handle: { title: "GET IT" }, element: <Link to="/apply">지원</Link> },
      { path: "/apply", handle: { title: "지원하기 · GET IT" }, element: <p /> },
    ]);
    await waitFor(() => expect(document.title).toBe("GET IT"));

    await userEvent.click(screen.getByRole("link", { name: "지원" }));

    await waitFor(() => expect(document.title).toBe("지원하기 · GET IT"));
  });

  it("겹친 라우트 중 가장 안쪽 제목을 쓴다", async () => {
    // 레이아웃에도 제목이 있으면 자식이 이겨야 한다. 안 그러면 `/member` 아래 네 화면이
    // 전부 레이아웃 제목 하나로 보인다.
    renderAt("/member/group", [
      {
        path: "/member",
        handle: { title: "부원 · GET IT" },
        element: <Outlet />,
        children: [{ path: "group", handle: { title: "내 그룹 · 부원 · GET IT" }, element: <p /> }],
      },
    ]);

    await waitFor(() => expect(document.title).toBe("내 그룹 · 부원 · GET IT"));
  });

  it("제목을 주지 않은 라우트에서는 바깥쪽 제목이 남는다", async () => {
    renderAt("/member/group", [
      {
        path: "/member",
        handle: { title: "부원 · GET IT" },
        element: <Outlet />,
        children: [{ path: "group", element: <p /> }],
      },
    ]);

    await waitFor(() => expect(document.title).toBe("부원 · GET IT"));
  });

  it("아무도 제목을 주지 않으면 홈 제목으로 돌아간다", async () => {
    // 이름 없는 탭보다는 사이트 이름이라도 보이는 게 낫다.
    renderAt("/", [{ path: "/", element: <p /> }]);

    await waitFor(() => expect(document.title).toBe("GET IT · 경북대학교 컴퓨터학부 SW&창업 동아리"));
  });
});
