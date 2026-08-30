import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getEvents } from "../../apis/public/publicApi";
import type { PublicEventCalendar } from "../../types/site";

import { ScheduleCalendar } from "./ScheduleCalendar";

vi.mock("../../apis/public/publicApi");

function calendar(year: number, month: number, events: PublicEventCalendar["events"] = []): PublicEventCalendar {
  return { year, month, events };
}

function renderCalendar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ScheduleCalendar />
    </QueryClientProvider>,
  );
}

describe("ScheduleCalendar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Date만 고정한다 — userEvent가 내부적으로 실제 타이머를 쓰므로 같이 잠가버리면 안 된다.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 0, 15));

    vi.mocked(getEvents).mockImplementation((year, month) => {
      if (year === 2026 && month === 1) {
        return Promise.resolve(
          calendar(2026, 1, [
            {
              id: 1,
              title: "신년 모임",
              startDate: "2026-01-05",
              endDate: "2026-01-05",
              type: "EVENT",
              place: "대강당",
            },
          ]),
        );
      }
      if (year === 2026 && month === 5) {
        return Promise.resolve(
          calendar(2026, 5, [
            {
              id: 2,
              title: "창업 해커톤",
              startDate: "2026-05-20",
              endDate: "2026-05-21",
              type: "COMPETITION",
              place: "대강당",
            },
          ]),
        );
      }
      return Promise.resolve(calendar(year, month, []));
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("이번 달 일정을 실제 종류 라벨과 함께 보여준다", async () => {
    renderCalendar();

    expect(await screen.findByText("신년 모임")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2026년 1월" })).toBeInTheDocument();
    expect(screen.getByText("2026-01-05")).toBeInTheDocument();
    // event/seminar 2종이 아니라 실제 SiteEventType(대회·워크숍·행사) 라벨을 쓴다.
    expect(screen.getByText("행사")).toBeInTheDocument();
  });

  it("1월 달력에 요일과 1~31일을 보여주고, 일정이 있는 날을 켠다", async () => {
    renderCalendar();

    await screen.findByText("신년 모임");
    for (const weekday of ["일", "월", "화", "수", "목", "금", "토"]) {
      expect(screen.getByText(weekday)).toBeInTheDocument();
    }
    expect(screen.getByText("31")).toBeInTheDocument();
  });

  it("다음 달 버튼을 누르면 2월로 넘어가고, 2월은 일정이 없다", async () => {
    renderCalendar();
    await screen.findByRole("heading", { name: "2026년 1월" });

    await userEvent.click(screen.getByRole("button", { name: "다음 달" }));

    expect(screen.getByRole("heading", { name: "2026년 2월" })).toBeInTheDocument();
    expect(await screen.findByText("이 달에는 예정된 일정이 없습니다.")).toBeInTheDocument();
  });

  it("1월에서 이전 달을 누르면 2025년 12월로 넘어간다", async () => {
    // 옛 목업은 한 해(2026년) 안에서만 순환했지만, 실제 캘린더는 연도 경계를 넘어야 한다.
    renderCalendar();
    await screen.findByRole("heading", { name: "2026년 1월" });

    await userEvent.click(screen.getByRole("button", { name: "이전 달" }));

    expect(await screen.findByRole("heading", { name: "2025년 12월" })).toBeInTheDocument();
    expect(vi.mocked(getEvents)).toHaveBeenLastCalledWith(2025, 12);
  });

  it("리렌더가 끼어들기 전에 이전 달 클릭이 두 번 겹치면 두 달 전으로 이동한다", async () => {
    // 두 클릭을 act() 하나로 묶어 리렌더 없이 연속 발생시킨다 — monthIndex를 직접 계산해
    // 두 클릭이 같은 값을 캡처하는 stale closure 버그가 재발하면 여기서 한 달만 이동해 걸린다.
    renderCalendar();
    await screen.findByRole("heading", { name: "2026년 1월" });

    const prevButton = screen.getByRole("button", { name: "이전 달" });
    await act(async () => {
      fireEvent.click(prevButton);
      fireEvent.click(prevButton);
    });

    expect(await screen.findByRole("heading", { name: "2025년 11월" })).toBeInTheDocument();
  });

  it("월 표시 점을 누르면 해당 달로 바로 이동한다", async () => {
    renderCalendar();
    await screen.findByRole("heading", { name: "2026년 1월" });

    await userEvent.click(screen.getByRole("button", { name: "5월로 이동" }));

    expect(screen.getByRole("heading", { name: "2026년 5월" })).toBeInTheDocument();
    expect(await screen.findByText("창업 해커톤")).toBeInTheDocument();
  });

  it("여러 날에 걸친 일정은 종료일까지 함께 보여준다", async () => {
    renderCalendar();
    await screen.findByRole("heading", { name: "2026년 1월" });

    await userEvent.click(screen.getByRole("button", { name: "5월로 이동" }));

    expect(await screen.findByText("2026-05-20 ~ 2026-05-21")).toBeInTheDocument();
  });
});
