import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectShowcase } from "./ProjectShowcase";

describe("ProjectShowcase", () => {
  it("제목과 프로젝트 3건을 보여준다", () => {
    render(<ProjectShowcase />);

    expect(screen.getByRole("heading", { name: "프로젝트 쇼케이스" })).toBeInTheDocument();
    for (const title of ["주식 포트폴리오 추천 시스템", "암호화폐 트레이딩 봇", "금융 뉴스 감성 분석"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("프로젝트 목록 페이지가 아직 없어 링크가 아니다", () => {
    render(<ProjectShowcase />);

    expect(screen.getByText("모든 프로젝트 보기")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
