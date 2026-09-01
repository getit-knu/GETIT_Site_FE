import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installViewTransitionGuard } from "./viewTransitionGuard";

/** `document.startViewTransition` 대역. `ready` 를 원하는 대로 실패시킬 수 있다. */
function fakeDocument(readyResult: Promise<void>, rules: { selectorText: string; name: string }[] = []) {
  const calls: unknown[][] = [];
  const transition = {
    ready: readyResult,
    finished: Promise.resolve(),
    updateCallbackDone: Promise.resolve(),
    skipTransition: () => {},
  };
  const doc = {
    calls,
    transition,
    startViewTransition: (...args: unknown[]) => {
      calls.push(args);
      return transition;
    },
    styleSheets: [
      {
        cssRules: rules.map((r) => ({
          selectorText: r.selectorText,
          style: { getPropertyValue: (p: string) => (p === "view-transition-name" ? r.name : "") },
        })),
      },
    ],
    // 규칙마다 요소가 두 개씩 잡힌 것으로 둔다.
    querySelectorAll: (sel: string) => (rules.some((r) => r.selectorText === sel) ? [{}, {}] : []),
  };
  return doc as unknown as Document & typeof doc;
}

const domException = (name: string, message: string) => new DOMException(message, name);

/** 한 매크로태스크 뒤까지 기다린다 — unhandledrejection 은 마이크로태스크가 다 돈 뒤에 발화한다. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("installViewTransitionGuard", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  let unhandled: unknown[];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    unhandled = [];
    process.on("unhandledRejection", onUnhandled);
  });

  afterEach(() => {
    process.off("unhandledRejection", onUnhandled);
    warn.mockRestore();
  });

  it("View Transitions 를 모르는 브라우저에서는 아무 것도 하지 않는다", () => {
    const doc = { startViewTransition: undefined } as unknown as Document;
    expect(() => installViewTransitionGuard(doc)).not.toThrow();
    expect(doc.startViewTransition).toBeUndefined();
  });

  it("이어지는 이동 때문에 끊긴 전환(AbortError)은 조용히 넘긴다", async () => {
    const doc = fakeDocument(Promise.reject(domException("AbortError", "Transition was skipped")));
    installViewTransitionGuard(doc);

    doc.startViewTransition(() => {});
    await settle();

    // 이 단언이 이 파일의 핵심이다. 가드를 빼면 여기서 rejection 이 새어 나온다.
    expect(unhandled).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("이름이 겹쳐 건너뛴 전환은 어떤 이름이 몇 개인지 짚어 준다", async () => {
    const doc = fakeDocument(
      Promise.reject(domException("InvalidStateError", "Transition was aborted because of invalid state")),
      [{ selectorText: "._nav_abc_2", name: "site-nav" }],
    );
    installViewTransitionGuard(doc);

    doc.startViewTransition(() => {});
    await settle();

    expect(unhandled).toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
    const message = String(warn.mock.calls[0]?.[0]);
    expect(message).toContain("site-nav");
    expect(message).toContain("._nav_abc_2");
  });

  it("전환 객체를 그대로 돌려주고, 원본을 한 번만 부른다", async () => {
    const doc = fakeDocument(Promise.reject(domException("AbortError", "skipped")));
    installViewTransitionGuard(doc);

    const callback = () => {};
    const returned = doc.startViewTransition(callback);
    await settle();

    expect(returned).toBe(doc.transition);
    expect(doc.calls).toEqual([[callback]]);
  });

  it("두 번 설치해도 한 겹만 감싼다", async () => {
    const doc = fakeDocument(Promise.reject(domException("AbortError", "skipped")));
    installViewTransitionGuard(doc);
    const afterFirst = doc.startViewTransition;
    installViewTransitionGuard(doc);

    expect(doc.startViewTransition).toBe(afterFirst);

    doc.startViewTransition(() => {});
    await settle();
    expect(doc.calls).toHaveLength(1);
  });
});
