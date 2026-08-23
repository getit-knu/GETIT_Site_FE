import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("다음 달 버튼을 누르면 2월로 넘어가고, 2월은 일정이 없다", async () => {
    render(<ScheduleCalendar />);

    await userEvent.click(screen.getByRole("button", { name: "다음 달" }));

    expect(screen.getByRole("heading", { name: "2026년 2월" })).toBeInTheDocument();
    expect(screen.getByText("이 달에는 예정된 일정이 없습니다.")).toBeInTheDocument();
  });

  it("1월에서 이전 달을 누르면 12월로 순환한다", async () => {
    render(<ScheduleCalendar />);

    await userEvent.click(screen.getByRole("button", { name: "이전 달" }));

    expect(screen.getByRole("heading", { name: "2026년 12월" })).toBeInTheDocument();
  });

  it("리렌더가 끼어들기 전에 이전 달 클릭이 두 번 겹치면 두 달 전으로 이동한다", () => {
    // 두 클릭을 act() 하나로 묶어 리렌더 없이 연속 발생시킨다 — monthIndex를 직접 계산해
    // 두 클릭이 같은 값을 캡처하는 stale closure 버그가 재발하면 여기서 한 달만 이동해 걸린다.
    render(<ScheduleCalendar />);

    const prevButton = screen.getByRole("button", { name: "이전 달" });
    act(() => {
      fireEvent.click(prevButton);
      fireEvent.click(prevButton);
    });

    expect(screen.getByRole("heading", { name: "2026년 11월" })).toBeInTheDocument();
  });

  it("월 표시 점을 누르면 해당 달로 바로 이동한다", async () => {
    render(<ScheduleCalendar />);

    await userEvent.click(screen.getByRole("button", { name: "5월로 이동" }));

    expect(screen.getByRole("heading", { name: "2026년 5월" })).toBeInTheDocument();
    expect(screen.getByText("창업 해커톤")).toBeInTheDocument();
  });
});
