import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getEvents } from "../../apis/public/publicApi";
import type { PublicEventCalendar } from "../../types/site";

import { ScheduleCalendar } from "./ScheduleCalendar";

vi.mock("../../apis/public/publicApi");

/*
 * 겹친 일정의 줄(lane) 배정만 따로 본다 — `ScheduleCalendar.test.tsx`가 max-lines(300)를
 * 넘겼고, 겹침은 한 덩어리로 읽히는 주제라 파일을 가르는 자리로도 알맞다.
 */

function calendar(year: number, month: number, events: PublicEventCalendar["events"] = []): PublicEventCalendar {
  return { year, month, events };
}

/**
 * 날짜 칸 안에서 특정 일정의 얇은 선을 집는다.
 *
 * 이어짐(`data-connect-*`)은 칸이 아니라 **선마다** 붙는다 — 한 칸에 여러 일정이 겹치면
 * 7일에 끝난 일정과 8일에 시작한 다른 일정이 칸 단위로는 구분되지 않아, 서로 다른 일정을
 * 한 줄로 이어 붙이는 거짓말이 된다.
 */
function lane(cell: HTMLElement, eventId: number) {
  const found = cell.querySelector(`[data-event-id="${eventId}"]`);
  if (found === null) throw new Error(`날짜 칸에 일정 ${eventId}의 선이 없다`);
  return found;
}

/** 앱과 같은 StrictMode 아래에서 렌더한다(`ScheduleCalendar.test.tsx` 상단 설명 참고). */
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

beforeEach(() => {
  vi.resetAllMocks();
  // Date만 고정한다 — userEvent가 내부적으로 실제 타이머를 쓰므로 같이 잠가버리면 안 된다.
  vi.useFakeTimers({ toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("한 날에 여러 일정이 겹칠 때", () => {
  beforeEach(() => {
    // 프로덕션 2026년 10월 그대로다 — 9/14~10/20 워크숍이 달을 가로지르고, 그 아래로
    // 10/1~10/7 워크숍과 10/8 하루 행사가 겹친다. 예전엔 한 날에 일정 하나만 남겨서
    // 1~20일이 진남색 알약 하나로 덮이고 나머지 두 일정은 캘린더에 아예 없었다.
    vi.setSystemTime(new Date(2026, 9, 5));
    vi.mocked(getEvents).mockImplementation((year, month) =>
      Promise.resolve(
        year === 2026 && month === 10
          ? calendar(2026, 10, [
              {
                id: 10,
                title: "팀별 빌드업 I",
                startDate: "2026-09-14",
                endDate: "2026-10-20",
                type: "WORKSHOP",
                place: "공학관",
              },
              {
                id: 11,
                title: "팀별 빌드업 III",
                startDate: "2026-10-01",
                endDate: "2026-10-07",
                type: "WORKSHOP",
                place: "공학관",
              },
              {
                id: 12,
                title: "아이디어 컨설팅",
                startDate: "2026-10-08",
                endDate: "2026-10-08",
                type: "EVENT",
                place: "대강당",
              },
            ])
          : calendar(year, month, []),
      ),
    );
  });

  it("겹친 일정을 버리지 않고 날마다 줄을 나눠 모두 보여준다", async () => {
    renderCalendar();
    await screen.findByText("팀별 빌드업 III");

    // 5일 — 워크숍 두 개가 겹친다. 달을 가로지르는 긴 쪽이 윗줄이라, 아래 줄의 짧은
    // 일정들이 긴 일정 위를 오르내리지 않는다.
    const day5 = screen.getByRole("button", { name: "10월 5일 일정 2개 보기" });
    expect(lane(day5, 10)).toHaveAttribute("data-lane", "0");
    expect(lane(day5, 11)).toHaveAttribute("data-lane", "1");

    // 8일 — 7일에 끝난 워크숍이 비운 줄로 하루짜리 행사가 들어온다.
    const day8 = screen.getByRole("button", { name: "10월 8일 일정 2개 보기" });
    expect(lane(day8, 10)).toHaveAttribute("data-lane", "0");
    expect(lane(day8, 12)).toHaveAttribute("data-lane", "1");

    // 20일에 마지막 일정이 끝나므로 25일은 누를 곳이 아니다.
    expect(screen.queryByRole("button", { name: /10월 25일/ })).not.toBeInTheDocument();
  });

  it("끝난 일정과 다음 날 시작한 다른 일정은 한 줄로 잇지 않는다", async () => {
    renderCalendar();
    await screen.findByText("팀별 빌드업 III");

    const day7 = screen.getByRole("button", { name: "10월 7일 일정 2개 보기" });
    const day8 = screen.getByRole("button", { name: "10월 8일 일정 2개 보기" });

    // 워크숍 III는 7일에서 끝난다 — 오른쪽으로 흘러나가면 8일 행사와 한 줄이 되어 버린다.
    expect(lane(day7, 11)).toHaveAttribute("data-connect-left");
    expect(lane(day7, 11)).not.toHaveAttribute("data-connect-right");
    // 8일 행사는 하루짜리라 양쪽 어디로도 이어지지 않는다.
    expect(lane(day8, 12)).not.toHaveAttribute("data-connect-left");
    expect(lane(day8, 12)).not.toHaveAttribute("data-connect-right");
  });

  it("주가 바뀌는 자리에서는 선을 끊는다", async () => {
    // 2026-10-03은 토, 10-04는 일 — 같은 일정이라도 줄이 갈리니 이어 붙이지 않는다.
    renderCalendar();
    await screen.findByText("팀별 빌드업 III");

    const saturday = screen.getByRole("button", { name: "10월 3일 일정 2개 보기" });
    const sunday = screen.getByRole("button", { name: "10월 4일 일정 2개 보기" });

    expect(lane(saturday, 10)).toHaveAttribute("data-connect-left");
    expect(lane(saturday, 10)).not.toHaveAttribute("data-connect-right");
    expect(lane(sunday, 10)).not.toHaveAttribute("data-connect-left");
    expect(lane(sunday, 10)).toHaveAttribute("data-connect-right");
  });

  it("겹친 날을 누르면 그 날에 걸린 일정을 목록에서 모두 짚어 준다", async () => {
    // 선 두 줄이 "이 날 일정 둘"이라고 말했으면, 목록도 둘을 가리켜야 한다.
    renderCalendar();
    await screen.findByText("팀별 빌드업 III");
    screen.getByRole("list").scrollTo = vi.fn();

    await userEvent.click(screen.getByRole("button", { name: "10월 5일 일정 2개 보기" }));

    expect(screen.getByText("팀별 빌드업 I").closest("li")).toHaveAttribute("data-selected");
    expect(screen.getByText("팀별 빌드업 III").closest("li")).toHaveAttribute("data-selected");
    expect(screen.getByText("아이디어 컨설팅").closest("li")).not.toHaveAttribute("data-selected");
  });

  describe("목록 카드로 캘린더의 선을 짚을 때", () => {
    /** 목록 카드를 덮는 오버레이 버튼. 카드 안에 `h4`가 있어 `button`으로 감쌀 수 없다. */
    function card(title: string) {
      return screen.getByRole("button", { name: `${title} 캘린더에서 보기` });
    }

    /** 날짜 그리드. `data-direction`이 달 넘김 애니메이션용으로 늘 붙어 있어 잡는 손잡이로 쓴다. */
    function dateGrid() {
      const grid = document.querySelector("[data-direction]");
      if (grid === null) throw new Error("날짜 그리드를 찾지 못했다");
      return grid;
    }

    it("그 일정의 선만 짚고, 같은 날 겹친 다른 일정의 선은 건드리지 않는다", async () => {
      renderCalendar();
      await screen.findByText("팀별 빌드업 III");

      await userEvent.click(card("팀별 빌드업 III"));

      // 5일은 세 일정이 겹치는 날 — 누른 일정의 줄에만 표시가 붙어야 한다.
      const day5 = screen.getByRole("button", { name: "10월 5일 일정 2개 보기" });
      expect(lane(day5, 11)).toHaveAttribute("data-selected");
      expect(lane(day5, 10)).not.toHaveAttribute("data-selected");
      // 나머지 선을 흐리게 하는 것은 CSS가 하고, 그 스위치는 그리드에 달린다.
      expect(dateGrid()).toHaveAttribute("data-selecting-event");
    });

    it("걸친 모든 날의 선을 짚는다", async () => {
      renderCalendar();
      await screen.findByText("팀별 빌드업 III");

      await userEvent.click(card("팀별 빌드업 III"));

      // 1~7일 전체가 이 일정이다 — 시작일만 짚으면 "이 일정"이 아니라 "이 날"을 짚는 셈이다.
      for (const day of [1, 3, 4, 7]) {
        const cell = screen.getByRole("button", { name: new RegExp(`^10월 ${day}일 `) });
        expect(lane(cell, 11)).toHaveAttribute("data-selected");
      }
      // 8일부터는 이 일정이 없다.
      const day8 = screen.getByRole("button", { name: "10월 8일 일정 2개 보기" });
      expect(day8.querySelector('[data-event-id="11"]')).toBeNull();
    });

    it("그 카드만 강조하고, 같은 날 겹친 다른 일정 카드는 강조하지 않는다", async () => {
      renderCalendar();
      await screen.findByText("팀별 빌드업 III");

      await userEvent.click(card("팀별 빌드업 III"));

      expect(screen.getByText("팀별 빌드업 III").closest("li")).toHaveAttribute("data-selected");
      // 5일을 함께 쓰는 일정이지만, 내가 누른 건 저쪽 카드가 아니다.
      expect(screen.getByText("팀별 빌드업 I").closest("li")).not.toHaveAttribute("data-selected");
      expect(card("팀별 빌드업 III")).toHaveAttribute("aria-pressed", "true");
      expect(card("팀별 빌드업 I")).toHaveAttribute("aria-pressed", "false");
    });

    it("날짜 선택과 일정 선택은 한 번에 하나만 살아 있는다", async () => {
      renderCalendar();
      await screen.findByText("팀별 빌드업 III");
      screen.getByRole("list").scrollTo = vi.fn();

      // 날짜 → 카드: 칸 표시가 풀리고 선 표시로 넘어간다.
      await userEvent.click(screen.getByRole("button", { name: "10월 5일 일정 2개 보기" }));
      expect(screen.getByRole("button", { name: "10월 5일 일정 2개 보기" })).toHaveAttribute("data-selected");

      await userEvent.click(card("팀별 빌드업 III"));
      const day5 = screen.getByRole("button", { name: "10월 5일 일정 2개 보기" });
      expect(day5).not.toHaveAttribute("data-selected");
      expect(lane(day5, 11)).toHaveAttribute("data-selected");

      // 카드 → 날짜: 반대로도 풀린다.
      await userEvent.click(screen.getByRole("button", { name: "10월 5일 일정 2개 보기" }));
      const again = screen.getByRole("button", { name: "10월 5일 일정 2개 보기" });
      expect(again).toHaveAttribute("data-selected");
      expect(lane(again, 11)).not.toHaveAttribute("data-selected");
      expect(dateGrid()).not.toHaveAttribute("data-selecting-event");
    });

    it("달을 넘기면 골라 둔 일정도 풀린다", async () => {
      renderCalendar();
      await screen.findByText("팀별 빌드업 III");

      await userEvent.click(card("팀별 빌드업 III"));
      await userEvent.click(screen.getByRole("button", { name: "다음 달" }));
      await userEvent.click(screen.getByRole("button", { name: "이전 달" }));
      await screen.findByText("팀별 빌드업 III");

      expect(screen.getByText("팀별 빌드업 III").closest("li")).not.toHaveAttribute("data-selected");
      expect(dateGrid()).not.toHaveAttribute("data-selecting-event");
    });
  });

  it("줄 수 상한을 넘게 겹치면 선은 상한까지만 그리고 개수는 이름표로 알린다", async () => {
    // 48px 칸에 네 줄 이상을 밀어 넣으면 선끼리 붙어 오히려 한 덩어리로 보인다.
    vi.mocked(getEvents).mockImplementation((year, month) =>
      Promise.resolve(
        year === 2026 && month === 11
          ? calendar(2026, 11, [
              {
                id: 20,
                title: "긴 일정",
                startDate: "2026-11-01",
                endDate: "2026-11-30",
                type: "WORKSHOP",
                place: "공학관",
              },
              {
                id: 21,
                title: "겹침 둘",
                startDate: "2026-11-05",
                endDate: "2026-11-15",
                type: "WORKSHOP",
                place: "공학관",
              },
              {
                id: 22,
                title: "겹침 셋",
                startDate: "2026-11-08",
                endDate: "2026-11-12",
                type: "EVENT",
                place: "대강당",
              },
              {
                id: 23,
                title: "겹침 넷",
                startDate: "2026-11-09",
                endDate: "2026-11-11",
                type: "COMPETITION",
                place: "대강당",
              },
            ])
          : calendar(year, month, []),
      ),
    );
    renderCalendar();
    await screen.findByRole("heading", { name: "2026년 10월" });

    await userEvent.click(screen.getByRole("button", { name: "다음 달" }));
    await screen.findByText("겹침 넷");

    const day10 = screen.getByRole("button", { name: "11월 10일 일정 4개 보기" });
    expect(day10.querySelectorAll("[data-lane]")).toHaveLength(3);
    expect(day10.querySelector('[data-event-id="23"]')).toBeNull();
  });
});
