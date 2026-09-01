import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAnimatedPresence } from "./useAnimatedPresence";

describe("useAnimatedPresence", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("열리면 즉시 마운트된다", () => {
    const { result } = renderHook(({ open }) => useAnimatedPresence(open), { initialProps: { open: true } });
    expect(result.current.mounted).toBe(true);
    expect(result.current.exiting).toBe(false);
  });

  it("닫혀도 퇴장 모션 동안 마운트를 유지하다가 폴백 시간 뒤 내려간다", () => {
    const { result, rerender } = renderHook(({ open }) => useAnimatedPresence(open, 200), {
      initialProps: { open: true },
    });

    rerender({ open: false });
    expect(result.current.mounted).toBe(true);
    expect(result.current.exiting).toBe(true);

    act(() => vi.advanceTimersByTime(200));
    expect(result.current.mounted).toBe(false);
  });

  it("endExit를 부르면 폴백을 기다리지 않고 바로 내려간다", () => {
    const { result, rerender } = renderHook(({ open }) => useAnimatedPresence(open, 200), {
      initialProps: { open: true },
    });

    rerender({ open: false });
    act(() => result.current.endExit());
    expect(result.current.mounted).toBe(false);
  });

  it("퇴장 중 다시 열리면 unmount가 취소된다", () => {
    const { result, rerender } = renderHook(({ open }) => useAnimatedPresence(open, 200), {
      initialProps: { open: true },
    });

    rerender({ open: false });
    rerender({ open: true });
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.mounted).toBe(true);
    expect(result.current.exiting).toBe(false);
  });
});
