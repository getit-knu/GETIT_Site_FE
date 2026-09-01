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

  it("open이 true인 렌더에서 mounted가 false인 순간이 한 번도 없다", () => {
    /*
      여는 것을 렌더 중 `setMounted(true)`로 처리하던 시절에는, open이 막 true가 된 첫 렌더가
      `mounted: false`로 한 번 지나갔다. 보통은 곧바로 다시 렌더돼 열렸지만, 브라우저
      StrictMode에서 그 업데이트가 되돌려지면서 **모달이 아예 안 열리는** 회귀가 났다.

      최종 결과만 보는 단언으로는 두 구현이 구별되지 않는다 — 지나간 렌더를 전부 모아서
      "open인데 안 마운트된" 렌더가 하나도 없음을 본다.
    */
    const seen: Array<{ open: boolean; mounted: boolean }> = [];
    const { rerender } = renderHook(
      ({ open }) => {
        const { mounted } = useAnimatedPresence(open);
        seen.push({ open, mounted });
      },
      { initialProps: { open: false } },
    );

    rerender({ open: true });

    expect(seen.filter((r) => r.open && !r.mounted)).toEqual([]);
  });
});
