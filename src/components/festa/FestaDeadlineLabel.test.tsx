import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toWindow } from "./festaDeadline";
import { FestaDeadlineLabel } from "./FestaDeadlineLabel";

const PERIOD = toWindow({ startAt: "2026-11-23T10:00:00+09:00", endAt: "2026-11-30T00:00:00+09:00" });

function renderLabel(action = "투표") {
  return render(
    <p data-testid="label">
      <FestaDeadlineLabel period={PERIOD} action={action} />
    </p>,
  );
}

describe("FestaDeadlineLabel (#377, #379)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("시작 전에는 시작 D-day를, 시작 당일에는 시작까지 남은 시간을 보여준다", () => {
    vi.setSystemTime(new Date("2026-11-22T23:59:30+09:00"));
    renderLabel();
    expect(screen.getByTestId("label")).toHaveTextContent("투표 시작 D-1");

    act(() => vi.advanceTimersByTime(60_000));

    expect(screen.getByTestId("label")).toHaveTextContent("투표 시작까지 09:59:30");
  });

  it("시작 시각이 되면 마감 D-day로 넘어간다", () => {
    vi.setSystemTime(new Date("2026-11-23T09:59:59+09:00"));
    renderLabel();
    expect(screen.getByRole("timer")).toHaveTextContent("00:00:01");

    act(() => vi.advanceTimersByTime(1_000));

    expect(screen.getByTestId("label")).toHaveTextContent("투표 마감 D-6");
  });

  it("투자 방식이면 투자 마감으로 쓴다", () => {
    vi.setSystemTime(new Date("2026-11-26T10:00:00+09:00"));
    renderLabel("투자");

    expect(screen.getByTestId("label")).toHaveTextContent("투자 마감 D-3");
  });

  it("마지막 날 0시가 되면 D-1에서 카운트다운으로 넘어간다", () => {
    vi.setSystemTime(new Date("2026-11-28T23:59:30+09:00"));
    renderLabel();
    expect(screen.getByTestId("label")).toHaveTextContent("투표 마감 D-1");

    act(() => vi.advanceTimersByTime(60_000));

    expect(screen.getByTestId("label")).toHaveTextContent("마감까지 23:59:30");
  });

  it("마지막 날에는 남은 시간을 1초마다 줄여 보여준다", () => {
    vi.setSystemTime(new Date("2026-11-29T18:47:27+09:00"));
    renderLabel();

    expect(screen.getByTestId("label")).toHaveTextContent("마감까지 05:12:33");
    act(() => vi.advanceTimersByTime(1_000));
    expect(screen.getByRole("timer")).toHaveTextContent("05:12:32");
  });

  it("마감 시각이 지나면 마감으로 바뀌고 더 세지 않는다", () => {
    vi.setSystemTime(new Date("2026-11-29T23:59:58+09:00"));
    renderLabel();
    expect(screen.getByRole("timer")).toHaveTextContent("00:00:02");

    act(() => vi.advanceTimersByTime(2_000));

    expect(screen.getByTestId("label")).toHaveTextContent("투표 마감");
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });
});
