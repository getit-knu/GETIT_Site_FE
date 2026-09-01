import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useScrollReveal } from "./useScrollReveal";

describe("useScrollReveal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("IntersectionObserver가 없는 환경(jsdom)에서는 처음부터 드러난 상태다", () => {
    const { result } = renderHook(() => useScrollReveal<HTMLDivElement>());
    const [, revealed] = result.current;

    expect(revealed).toBe(true);
  });

  it("요소가 뷰포트에 들어오면 드러나고 관찰을 끊는다", async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let intersect: (entries: Array<{ isIntersecting: boolean }>) => void = () => {};

    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
          intersect = callback;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );

    const { result } = renderHook(() => useScrollReveal<HTMLDivElement>());

    // 실제 컴포넌트에서는 JSX `ref={...}`가 마운트 시점에 호출해 주는 부분.
    act(() => result.current[0](document.createElement("div")));

    await waitFor(() => expect(observe).toHaveBeenCalled());
    expect(result.current[1]).toBe(false);

    act(() => intersect([{ isIntersecting: true }]));
    await waitFor(() => expect(result.current[1]).toBe(true));
    expect(disconnect).toHaveBeenCalled();
  });

  it("요소가 effect 이후에 붙어도(데이터 로드 뒤 렌더) 관찰이 시작된다", async () => {
    const observe = vi.fn();

    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = observe;
        disconnect = vi.fn();
      },
    );

    const { result, rerender } = renderHook(() => useScrollReveal<HTMLDivElement>());
    expect(observe).not.toHaveBeenCalled();

    // FAQ·쇼케이스처럼 데이터가 도착한 뒤에야 요소가 마운트되는 흐름을 흉내 낸다.
    rerender();
    act(() => result.current[0](document.createElement("div")));

    await waitFor(() => expect(observe).toHaveBeenCalled());
  });
});
