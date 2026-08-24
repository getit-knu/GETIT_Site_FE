import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CurriculumTimeline } from "./CurriculumTimeline";

describe("CurriculumTimeline", () => {
  it("제목과 1학기 · 2학기 커리큘럼을 보여준다", () => {
    render(<CurriculumTimeline />);

    expect(screen.getByRole("heading", { name: "커리큘럼" })).toBeInTheDocument();

    const semester1 = within(screen.getByRole("heading", { name: "1학기" }).closest("div")!);
    for (const item of ["GETIT Chat", "SW 교육", "창업 빌드업", "세미나", "창업 관련 행사", "창업 해커톤"]) {
      expect(semester1.getByText(item)).toBeInTheDocument();
    }

    const semester2 = within(screen.getByRole("heading", { name: "2학기" }).closest("div")!);
    for (const item of ["GETIT Chat", "창업 빌드업", "세미나", "아이디어톤", "MVP 제작", "유저유치행사"]) {
      expect(semester2.getByText(item)).toBeInTheDocument();
    }
  });
});
