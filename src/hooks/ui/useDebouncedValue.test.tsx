import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("처음에는 받은 값을 그대로 돌려준다", () => {
    const { result } = renderHook(() => useDebouncedValue("김"));

    expect(result.current).toBe("김");
  });

  it("정해진 시간이 지나야 새 값을 넘긴다", () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
      initialProps: { v: "김" },
    });

    rerender({ v: "김지" });
    expect(result.current).toBe("김");

    act(() => void vi.advanceTimersByTime(300));
    expect(result.current).toBe("김지");
  });

  it("연달아 바뀌면 마지막 값만 넘긴다", () => {
    // "김지원" 을 치는 동안 요청이 세 번 나가면 안 된다.
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
      initialProps: { v: "김" },
    });

    rerender({ v: "김지" });
    act(() => void vi.advanceTimersByTime(100));
    rerender({ v: "김지원" });
    act(() => void vi.advanceTimersByTime(100));

    // 아직 잠잠해지지 않았다.
    expect(result.current).toBe("김");

    act(() => void vi.advanceTimersByTime(300));
    expect(result.current).toBe("김지원");
  });
});
