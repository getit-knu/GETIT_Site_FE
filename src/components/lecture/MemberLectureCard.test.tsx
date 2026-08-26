import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MemberLecture } from "../../mocks/lecture/memberLectures";

import { MemberLectureCard } from "./MemberLectureCard";

const LECTURE: MemberLecture = {
  id: 1,
  trackId: 1,
  subCategoryId: 1,
  week: 1,
  title: "HTML/CSS 기초",
  durationMinutes: 90,
  deadline: "2026-06-05",
  completed: true,
};

describe("MemberLectureCard", () => {
  it("트랙 배지 · 제목 · 소요시간 · 마감 · 완료 배지를 렌더링한다", () => {
    render(<MemberLectureCard lecture={LECTURE} />);

    expect(screen.getByText("WEB 기초")).toBeInTheDocument();
    expect(screen.getByText("HTML/CSS 기초")).toBeInTheDocument();
    expect(screen.getByText("1시간 30분")).toBeInTheDocument();
    expect(screen.getByText("마감 2026-06-05")).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();
    expect(screen.getByText("Week 1")).toBeInTheDocument();
  });

  it("완료하지 않았으면 완료 배지를 보여주지 않는다", () => {
    render(<MemberLectureCard lecture={{ ...LECTURE, completed: false }} />);

    expect(screen.queryByText("완료")).not.toBeInTheDocument();
  });

  it("소분류가 없는 강의는 트랙 이름을 배지로 보여준다", () => {
    render(<MemberLectureCard lecture={{ ...LECTURE, trackId: 2, subCategoryId: null }} />);

    expect(screen.getByText("창업 빌드업")).toBeInTheDocument();
  });

  it("onClick이 있으면 클릭 시 호출된다", () => {
    const handleClick = vi.fn();
    render(<MemberLectureCard lecture={LECTURE} onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
