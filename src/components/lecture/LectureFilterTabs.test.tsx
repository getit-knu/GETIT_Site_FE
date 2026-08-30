import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MemberTrack } from "../../types/lecture";

import { LectureFilterTabs } from "./LectureFilterTabs";
import { ALL_LECTURES_FILTER } from "./lectureFilters";

const TRACKS: MemberTrack[] = [
  { id: 1, name: "SW", subCategories: [{ id: 1, name: "WEB 기초" }] },
  { id: 2, name: "창업 빌드업", subCategories: [] },
];

describe("LectureFilterTabs", () => {
  it("전체와 트랙 · 소분류별 탭을 렌더링한다(개수 배지는 없다)", () => {
    render(<LectureFilterTabs tracks={TRACKS} value={ALL_LECTURES_FILTER} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "전체", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "WEB 기초" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "창업 빌드업" })).toBeInTheDocument();
  });

  it("탭 클릭 시 onChange에 선택 키를 전달한다", () => {
    const handleChange = vi.fn();
    render(<LectureFilterTabs tracks={TRACKS} value={ALL_LECTURES_FILTER} onChange={handleChange} />);

    fireEvent.click(screen.getByRole("button", { name: "WEB 기초" }));

    expect(handleChange).toHaveBeenCalledWith("sub-1");
  });
});
