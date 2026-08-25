import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectFilterTabs } from "./ProjectFilterTabs";

describe("ProjectFilterTabs", () => {
  it("4개의 필터 탭을 렌더링하고 선택된 탭만 활성 표시한다", () => {
    render(<ProjectFilterTabs value="전체" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "전체", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2025 Fall", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2025 Spring", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2024 Fall", pressed: false })).toBeInTheDocument();
  });

  it("탭 클릭 시 onChange에 선택값을 전달한다", () => {
    const handleChange = vi.fn();
    render(<ProjectFilterTabs value="전체" onChange={handleChange} />);

    fireEvent.click(screen.getByRole("button", { name: "2025 Fall" }));

    expect(handleChange).toHaveBeenCalledWith("2025 Fall");
  });
});
