import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MemberLecture } from "../../mocks/lecture/memberLectures";

import { LectureFilterTabs } from "./LectureFilterTabs";
import { ALL_LECTURES_FILTER } from "./lectureFilters";

const LECTURES: MemberLecture[] = [
  { id: 1, trackId: 1, subCategoryId: 1, week: 1, title: "A", durationMinutes: 60, deadline: "", completed: false },
  { id: 2, trackId: 1, subCategoryId: 2, week: 1, title: "B", durationMinutes: 60, deadline: "", completed: false },
  { id: 3, trackId: 2, subCategoryId: null, week: 1, title: "C", durationMinutes: 60, deadline: "", completed: false },
];

describe("LectureFilterTabs", () => {
  it("전체와 트랙 · 소분류별 탭을 카운트와 함께 렌더링한다", () => {
    render(<LectureFilterTabs lectures={LECTURES} value={ALL_LECTURES_FILTER} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "전체 (3)", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "WEB 기초 (1)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "창업 빌드업 (1)" })).toBeInTheDocument();
  });

  it("탭 클릭 시 onChange에 선택 키를 전달한다", () => {
    const handleChange = vi.fn();
    render(<LectureFilterTabs lectures={LECTURES} value={ALL_LECTURES_FILTER} onChange={handleChange} />);

    fireEvent.click(screen.getByRole("button", { name: "WEB 기초 (1)" }));

    expect(handleChange).toHaveBeenCalledWith("sub-1");
  });
});
