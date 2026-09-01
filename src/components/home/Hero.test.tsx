import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { Hero } from "./Hero";

function renderHero() {
  const router = createMemoryRouter([{ path: "/", element: <Hero /> }], { initialEntries: ["/"] });
  return render(<RouterProvider router={router} />);
}

describe("Hero", () => {
  it("헤드라인과 설명 문구를 보여준다", () => {
    renderHero();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("LET'S MAKEANYTHING.");
    expect(
      screen.getByText("상상을 현실로 만드는 경북대학교 컴퓨터학부 SW&창업 동아리, GET IT입니다."),
    ).toBeInTheDocument();
  });

  it("CTA가 지원하기·프로젝트 목록으로 이동하는 링크다", () => {
    renderHero();

    expect(screen.getByRole("link", { name: /9기 지원하러 가기/ })).toHaveAttribute("href", "/apply");
    expect(screen.getByRole("link", { name: "프로젝트 구경하기" })).toHaveAttribute("href", "/projects");
  });
});
