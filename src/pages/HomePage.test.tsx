import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import HomePage from "./HomePage";

describe("HomePage", () => {
  it("Figma 와이어프레임 순서대로 6개 섹션을 모두 렌더링한다", () => {
    const router = createMemoryRouter([{ path: "/", Component: HomePage }], { initialEntries: ["/"] });
    render(<RouterProvider router={router} />);

    const headings = screen.getAllByRole("heading", { level: 1 }).concat(screen.getAllByRole("heading", { level: 2 }));
    const headingTexts = headings.map((heading) => heading.textContent);

    expect(headingTexts).toEqual([
      "LET'S MAKEANYTHING.",
      "GETIT과 함께한 순간들",
      "커리큘럼",
      "프로젝트 쇼케이스",
      "자주 묻는 질문",
    ]);
  });
});
