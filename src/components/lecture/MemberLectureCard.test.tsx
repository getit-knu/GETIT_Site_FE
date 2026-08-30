import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MemberLectureCard as LectureCardData } from "../../types/lecture";

import { MemberLectureCard } from "./MemberLectureCard";

const LECTURE: LectureCardData = {
  id: 1,
  week: 1,
  title: "HTML/CSS 기초",
  subCategoryName: "WEB 기초",
  trackName: "SW",
  durationMinutes: 90,
  deadline: "2026-06-05T23:59:00+09:00",
  completed: true,
};

describe("MemberLectureCard", () => {
  it("소분류 배지 · 제목 · 소요시간 · 마감 · 완료 배지를 렌더링한다", () => {
    render(<MemberLectureCard lecture={LECTURE} />);

    expect(screen.getByText("WEB 기초")).toBeInTheDocument();
    expect(screen.getByText("HTML/CSS 기초")).toBeInTheDocument();
    expect(screen.getByText("1시간 30분")).toBeInTheDocument();
    expect(screen.getByText("마감 2026. 06. 05. 23:59")).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();
    expect(screen.getByText("Week 1")).toBeInTheDocument();
  });

  it("완료하지 않았으면 완료 배지를 보여주지 않는다", () => {
    render(<MemberLectureCard lecture={{ ...LECTURE, completed: false }} />);

    expect(screen.queryByText("완료")).not.toBeInTheDocument();
  });

  it("소분류가 없는 강의는 트랙 이름을 배지로 보여준다", () => {
    render(<MemberLectureCard lecture={{ ...LECTURE, subCategoryName: null, trackName: "창업 빌드업" }} />);

    expect(screen.getByText("창업 빌드업")).toBeInTheDocument();
  });

  it("소요시간·마감이 없으면(과제 없는 강의) 해당 표시를 생략한다", () => {
    render(<MemberLectureCard lecture={{ ...LECTURE, durationMinutes: null, deadline: null }} />);

    expect(screen.queryByText(/시간|분/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^마감/)).not.toBeInTheDocument();
  });

  it("onClick이 있으면 클릭 시 호출된다", () => {
    const handleClick = vi.fn();
    render(<MemberLectureCard lecture={LECTURE} onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
