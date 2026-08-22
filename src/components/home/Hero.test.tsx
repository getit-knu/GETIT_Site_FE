import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "./Hero";

describe("Hero", () => {
  it("헤드라인과 설명 문구를 보여준다", () => {
    render(<Hero />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("LET'S MAKEANYTHING.");
    expect(screen.getByText("상상을 현실로 만드는 IT 창업 동아리, GET IT입니다.")).toBeInTheDocument();
  });

  it("지원하기 · 프로젝트 페이지가 아직 없어 CTA가 링크가 아니다", () => {
    render(<Hero />);

    expect(screen.getByText("9기 지원하러 가기")).toBeInTheDocument();
    expect(screen.getByText("프로젝트 구경하기")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
