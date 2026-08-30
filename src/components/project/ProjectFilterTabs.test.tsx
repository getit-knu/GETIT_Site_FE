import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectFilterTabs } from "./ProjectFilterTabs";

const SEMESTERS = ["2025-FALL", "2025-SPRING", "2024-FALL"];

describe("ProjectFilterTabs", () => {
  it("전체 탭과 서버가 준 학기 목록을 사람이 읽는 라벨로 렌더링한다", () => {
    render(<ProjectFilterTabs semesters={SEMESTERS} value="전체" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "전체", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2025 Fall", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2025 Spring", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2024 Fall", pressed: false })).toBeInTheDocument();
  });

  it("탭 클릭 시 onChange에 원본 학기 값(라벨이 아니라)을 전달한다", () => {
    const handleChange = vi.fn();
    render(<ProjectFilterTabs semesters={SEMESTERS} value="전체" onChange={handleChange} />);

    fireEvent.click(screen.getByRole("button", { name: "2025 Fall" }));

    expect(handleChange).toHaveBeenCalledWith("2025-FALL");
  });
});
