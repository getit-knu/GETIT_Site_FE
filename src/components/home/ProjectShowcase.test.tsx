import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { ProjectShowcase } from "./ProjectShowcase";

function renderShowcase() {
  const router = createMemoryRouter([{ path: "/", element: <ProjectShowcase /> }], { initialEntries: ["/"] });
  return render(<RouterProvider router={router} />);
}

describe("ProjectShowcase", () => {
  it("제목과 프로젝트 3건을 보여준다", () => {
    renderShowcase();

    expect(screen.getByRole("heading", { name: "프로젝트 쇼케이스" })).toBeInTheDocument();
    for (const title of ["주식 포트폴리오 추천 시스템", "암호화폐 트레이딩 봇", "금융 뉴스 감성 분석"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("모든 프로젝트 보기가 프로젝트 목록으로 이동하는 링크다", () => {
    renderShowcase();

    expect(screen.getByRole("link", { name: "모든 프로젝트 보기" })).toHaveAttribute("href", "/projects");
  });
});
