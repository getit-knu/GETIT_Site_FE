import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getEvents } from "../../apis/public/publicApi";
import type { PublicEventCalendar } from "../../types/site";

import { ScheduleCalendar } from "./ScheduleCalendar";

vi.mock("../../apis/public/publicApi");

function calendar(year: number, month: number, events: PublicEventCalendar["events"] = []): PublicEventCalendar {
  return { year, month, events };
}

/**
 * 날짜 칸 안에서 특정 일정의 얇은 선을 집는다.
 *
 * 이어짐(`data-connect-*`)은 칸이 아니라 **선마다** 붙는다 — 한 칸에 여러 일정이 겹치면
 * 8일에 끝난 일정과 9일에 시작한 다른 일정이 칸 단위로는 구분되지 않아, 서로 다른 일정을
 * 한 줄로 이어 붙이는 거짓말이 된다.
 */
function lane(cell: HTMLElement, eventId: number) {
  const found = cell.querySelector(`[data-event-id="${eventId}"]`);
  if (found === null) throw new Error(`날짜 칸에 일정 ${eventId}의 선이 없다`);
  return found;
}

/**
 * `StrictMode` 로 감싸서 렌더한다 — 앱은 `main.tsx` 에서 StrictMode 안에 있는데 테스트만
 * 벗겨 놓으면, StrictMode 가 일부러 드러내는 부작용(상태 업데이터 이중 호출 등)을 테스트가
 * 통과시켜 버린다. 실제로 연도 경계에서 2년씩 뛰던 버그를 이 테스트들이 놓쳤다.
 */
function renderCalendar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ScheduleCalendar />
      </QueryClientProvider>
    </StrictMode>,
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

  it("12월에서 다음 달을 누르면 다음 해 1월로 딱 한 해만 넘어간다", async () => {
    // 연도 경계를 넘길 때 setMonthIndex 업데이터 안에서 setYear 를 부르던 시절, StrictMode 가
    // 업데이터를 두 번 호출해 연도가 2년씩 뛰었다(2026년 12월 → 2028년 1월).
    renderCalendar();
    await screen.findByRole("heading", { name: "2026년 1월" });

    const nextButton = screen.getByRole("button", { name: "다음 달" });
    for (let i = 0; i < 11; i++) await userEvent.click(nextButton);
    expect(screen.getByRole("heading", { name: "2026년 12월" })).toBeInTheDocument();

    await userEvent.click(nextButton);

    expect(screen.getByRole("heading", { name: "2027년 1월" })).toBeInTheDocument();
    expect(vi.mocked(getEvents)).toHaveBeenLastCalledWith(2027, 1);
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

  it("오늘 버튼을 누르면 몇 달을 넘겨봤든 오늘이 속한 달로 돌아온다", async () => {
    // 하단 점 페이지네이션(월 바로가기)을 걷어내고 "오늘" 버튼으로 대체했다(좌우 화살표와 중복이라).
    renderCalendar();
    await screen.findByRole("heading", { name: "2026년 1월" });

    const nextButton = screen.getByRole("button", { name: "다음 달" });
    await userEvent.click(nextButton);
    await userEvent.click(nextButton);
    expect(screen.getByRole("heading", { name: "2026년 3월" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "오늘로 이동" }));

    expect(screen.getByRole("heading", { name: "2026년 1월" })).toBeInTheDocument();
  });

  it("불러오는 중에는 일정이 없다고 단정하지 않고 뼈대를 세운다", async () => {
    // 달을 넘길 때마다 응답이 오기 전에 "이 달에는 예정된 일정이 없습니다"가 한 번 번쩍이고
    // 목록이 다시 채워졌다. 아직 모르는 것을 없다고 말한 셈이라, 눈에도 걸리고 사실도 아니었다.
    let resolveFebruary: (value: PublicEventCalendar) => void = () => {};
    vi.mocked(getEvents).mockImplementation((year, month) => {
      if (year === 2026 && month === 2) return new Promise((resolve) => (resolveFebruary = resolve));
      return Promise.resolve(calendar(year, month, []));
    });

    renderCalendar();
    await screen.findByRole("heading", { name: "2026년 1월" });

    await userEvent.click(screen.getByRole("button", { name: "다음 달" }));

    expect(screen.getByRole("list", { name: "일정 불러오는 중" })).toBeInTheDocument();
    expect(screen.queryByText("이 달에는 예정된 일정이 없습니다.")).not.toBeInTheDocument();

    await act(async () => resolveFebruary(calendar(2026, 2, [])));

    expect(await screen.findByText("이 달에는 예정된 일정이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "일정 불러오는 중" })).not.toBeInTheDocument();
  });

  it("일정을 못 불러오면 빈 달과 다른 말을 한다", async () => {
    vi.mocked(getEvents).mockRejectedValue(new Error("network"));

    renderCalendar();

    expect(await screen.findByText("일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.")).toBeInTheDocument();
    expect(screen.queryByText("이 달에는 예정된 일정이 없습니다.")).not.toBeInTheDocument();
  });

  it("일정이 걸린 날만 누를 수 있다", async () => {
    renderCalendar();
    await screen.findByText("신년 모임");

    // 1월 5일에 일정이 있다 — 누를 수 있어야 한다.
    expect(screen.getByRole("button", { name: "1월 5일 일정 1개 보기" })).toBeInTheDocument();
    // 6일은 비었다 — 눌러도 갈 곳이 없으니 버튼이 아니다.
    expect(screen.queryByRole("button", { name: "1월 6일 일정 1개 보기" })).not.toBeInTheDocument();
  });

  it("일정이 있는 날을 누르면 그 일정으로 목록을 스크롤한다", async () => {
    renderCalendar();
    await screen.findByText("신년 모임");

    const list = screen.getByRole("list");
    const scrollTo = vi.fn();
    list.scrollTo = scrollTo;

    await userEvent.click(screen.getByRole("button", { name: "1월 5일 일정 1개 보기" }));

    expect(scrollTo).toHaveBeenCalledOnce();
    // 고른 날은 달력에서도 짚어 준다.
    expect(screen.getByRole("button", { name: "1월 5일 일정 1개 보기" })).toHaveAttribute("data-selected");
  });

  it("달을 넘기면 골라 둔 날은 풀린다", async () => {
    renderCalendar();
    await screen.findByText("신년 모임");

    screen.getByRole("list").scrollTo = vi.fn();
    await userEvent.click(screen.getByRole("button", { name: "1월 5일 일정 1개 보기" }));
    await userEvent.click(screen.getByRole("button", { name: "다음 달" }));
    await userEvent.click(screen.getByRole("button", { name: "이전 달" }));

    expect(screen.getByRole("button", { name: "1월 5일 일정 1개 보기" })).not.toHaveAttribute("data-selected");
  });

  it("여러 날에 걸친 일정은 두 칸의 선을 하나로 잇는다", async () => {
    // 5월 20~21일 창업 해커톤(수·목). 20일 선은 오른쪽으로, 21일 선은 왼쪽으로 흘러
    // 칸 사이 간격을 메우고 한 줄이 된다.
    renderCalendar();
    await screen.findByRole("heading", { name: "2026년 1월" });

    const nextButton = screen.getByRole("button", { name: "다음 달" });
    for (let i = 0; i < 4; i++) await userEvent.click(nextButton);
    await screen.findByText("창업 해커톤");

    const start = screen.getByRole("button", { name: "5월 20일 일정 1개 보기" });
    const end = screen.getByRole("button", { name: "5월 21일 일정 1개 보기" });

    expect(lane(start, 2)).toHaveAttribute("data-connect-right");
    expect(lane(start, 2)).not.toHaveAttribute("data-connect-left");
    expect(lane(end, 2)).toHaveAttribute("data-connect-left");
    expect(lane(end, 2)).not.toHaveAttribute("data-connect-right");
  });

  it("여러 날에 걸친 일정은 종료일까지 함께 보여준다", async () => {
    renderCalendar();
    await screen.findByRole("heading", { name: "2026년 1월" });

    const nextButton = screen.getByRole("button", { name: "다음 달" });
    for (let i = 0; i < 4; i++) await userEvent.click(nextButton);
    expect(screen.getByRole("heading", { name: "2026년 5월" })).toBeInTheDocument();

    expect(await screen.findByText("2026-05-20 ~ 2026-05-21")).toBeInTheDocument();
  });
});
