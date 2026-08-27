import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { Nav } from "./Nav";

/** 링크를 눌러 실제로 이동해도 라우트가 있어야 Nav가 언마운트되지 않는다. */
function renderNav() {
  const router = createMemoryRouter(
    ["/", "/projects", "/leaders", "/login", "/apply"].map((path) => ({ path, element: <Nav /> })),
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("Nav", () => {
  it("메뉴 버튼은 처음엔 닫힌 상태다", () => {
    renderNav();

    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute("aria-expanded", "false");
  });

  it("버튼을 누르면 메뉴가 열리고 라벨이 바뀐다", async () => {
    renderNav();

    await userEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));

    expect(screen.getByRole("button", { name: "메뉴 닫기" })).toHaveAttribute("aria-expanded", "true");
  });

  it("다시 누르면 닫힌다", async () => {
    renderNav();

    const toggle = screen.getByRole("button", { name: "메뉴 열기" });
    await userEvent.click(toggle);
    await userEvent.click(screen.getByRole("button", { name: "메뉴 닫기" }));

    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute("aria-expanded", "false");
  });

  it("링크를 누르면 메뉴가 닫힌다", async () => {
    renderNav();

    await userEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
    await userEvent.click(screen.getByRole("link", { name: "프로젝트" }));

    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute("aria-expanded", "false");
  });
});
