import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScheduleCalendar } from "./ScheduleCalendar";

describe("ScheduleCalendar", () => {
  it("이번 달 일정을 보여준다", () => {
    render(<ScheduleCalendar />);

    expect(screen.getByRole("heading", { name: "2026년 1월" })).toBeInTheDocument();
    expect(screen.getByText("신년 모임")).toBeInTheDocument();
    expect(screen.getByText("1월 5일")).toBeInTheDocument();
    expect(screen.getByText("event")).toBeInTheDocument();
  });

  it("1월 달력에 요일과 1~31일을 보여준다", () => {
    render(<ScheduleCalendar />);

    for (const weekday of ["일", "월", "화", "수", "목", "금", "토"]) {
      expect(screen.getByText(weekday)).toBeInTheDocument();
    }
    expect(screen.getByText("31")).toBeInTheDocument();
  });
});
