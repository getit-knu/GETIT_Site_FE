import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { PublicLayout } from "./PublicLayout";

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <PublicLayout />,
        children: [{ index: true, element: <p>홈 본문</p> }],
      },
    ],
    { initialEntries: [path] },
  );

  return render(<RouterProvider router={router} />);
}

describe("PublicLayout", () => {
  it("Nav · 본문 · Footer를 함께 렌더링한다", () => {
    renderAt("/");

    expect(screen.getByRole("link", { name: "GETIT" })).toBeInTheDocument();
    expect(screen.getByText("홈 본문")).toBeInTheDocument();
    expect(screen.getByText("© 2026 GETIT. All rights reserved.")).toBeInTheDocument();
  });

  it("홈 · 프로젝트 · 지원하기 · 운영진 모두 실제 링크이다.", () => {
    renderAt("/");

    const nav = within(screen.getByRole("banner"));
    expect(nav.getByRole("link", { name: "홈", current: "page" })).toBeInTheDocument();
    expect(nav.getByRole("link", { name: "프로젝트" })).toHaveAttribute("href", "/projects");
    expect(nav.getByRole("link", { name: "지원하기" })).toHaveAttribute("href", "/apply");
    for (const label of ["운영진", "로그인", "지원하기"]) {
      expect(nav.getByText(label)).toBeInTheDocument();
    }
    expect(nav.queryAllByRole("link")).toHaveLength(5); // GETIT 로고 + 홈 + 프로젝트 + 지원하기 + 운영진
  });

  it("Footer 바로가기 항목도 아직 링크가 아니다", () => {
    renderAt("/");

    const footer = within(screen.getByRole("contentinfo"));
    for (const label of ["지원하기", "프로젝트", "운영진"]) {
      expect(footer.getByText(label)).toBeInTheDocument();
    }
    expect(footer.queryByRole("link")).not.toBeInTheDocument();
  });
});
