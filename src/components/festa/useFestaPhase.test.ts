import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toWindow } from "./festaDeadline";
import { useFestaPhase } from "./useFestaPhase";

const PERIOD = toWindow({ startAt: "2026-11-23T10:00:00+09:00", endAt: "2026-11-30T00:00:00+09:00" });

describe("useFestaPhase (#379)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("기간을 정하지 않았으면 unscheduled 이고 타이머를 걸지 않는다", () => {
    const { result } = renderHook(() => useFestaPhase(null));

    expect(result.current).toBe("unscheduled");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("시작 시각과 마감 시각에 맞춰 단계가 바뀐다", () => {
    vi.setSystemTime(new Date("2026-11-23T09:59:30+09:00"));
    const { result } = renderHook(() => useFestaPhase(PERIOD));
    expect(result.current).toBe("before");

    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current).toBe("open");

    act(() => vi.setSystemTime(new Date("2026-11-29T23:59:59+09:00")));
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current).toBe("closed");
    expect(vi.getTimerCount()).toBe(0);
  });
});
