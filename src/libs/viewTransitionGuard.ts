/**
 * 페이지 전환(View Transitions)이 건너뛰어질 때 콘솔에 남는 잡음을 치우고, 원인을 대신 짚어 준다.
 *
 * `document.startViewTransition()` 이 돌려주는 객체에는 프로미스가 셋 있고, 그중 `ready` 는
 * **전환이 시작도 못 하고 건너뛰어지면 reject 된다.** react-router 는 `finished` 에만 핸들러를
 * 달고 `ready` 는 건드리지 않아서(`RouterProvider` 내부), 전환이 한 번 건너뛰어질 때마다
 * 아무도 받지 않은 rejection 이 남는다:
 *
 *     Uncaught (in promise) InvalidStateError: Transition was aborted because of invalid state
 *
 * Chrome 152 에서 직접 확인한 "건너뛰는 조건 → 그때의 오류" 다. `finished` 는 셋 다 정상
 * resolve 하므로, 라우터의 뒷정리는 어느 쪽이든 영향을 받지 않는다.
 *
 *   - 앞 전환이 끝나기 전에 다음 전환 시작 → `AbortError: Transition was skipped`
 *   - `skipTransition()` 직접 호출          → `AbortError: Transition was skipped`
 *   - `view-transition-name` 중복           → `InvalidStateError: ...invalid state`
 *
 * 앞의 둘은 링크를 빠르게 이어 누를 때 늘 일어나는 정상 동작이라 조용히 넘긴다. 마지막
 * 하나는 진짜 버그다 — 이름이 겹치면 그 전환은 통째로 건너뛰어져 애니메이션이 아예 안 나온다.
 * 그래서 삼키지 않고, 개발 중에는 어떤 이름이 몇 개나 잡혔는지 함께 찍는다.
 * (브라우저도 `Unexpected duplicate view-transition-name: <이름>` 을 따로 찍어 준다.)
 *
 * 이 앱에서 이름을 다는 곳은 `Nav.module.scss` 의 `site-nav` 하나뿐이고, 그걸 그리는
 * `<Nav>` 는 `PublicLayout` 안에만 있다. 즉 이름이 겹친다면 `PublicLayout` 이 두 벌
 * 붙어 있다는 뜻이므로, 아래 진단이 찍히면 거기부터 보면 된다.
 */

/** 이미 감싼 함수인지 표시해 둔다 — StrictMode·HMR 로 두 번 설치돼도 겹쳐 싸지 않게. */
const GUARD_FLAG = "__getitViewTransitionGuard";

type StartViewTransition = Document["startViewTransition"];
type GuardedStart = StartViewTransition & { [GUARD_FLAG]?: true };

/** 문서에서 지금 `view-transition-name` 이 겹친 이름을 찾는다. 레이아웃을 건드리지 않는 읽기만 쓴다. */
function findDuplicateNames(doc: Document): { name: string; count: number; selectors: string[] }[] {
  const byName = new Map<string, { count: number; selectors: string[] }>();

  const visit = (rules: Iterable<CSSRule>) => {
    for (const rule of rules) {
      // @media 같은 묶음 규칙 안에도 들어 있을 수 있다.
      if ("cssRules" in rule) visit((rule as CSSGroupingRule).cssRules);

      // `instanceof CSSStyleRule` 대신 모양으로 가린다 — 규칙이 다른 realm(iframe 등)에서
      // 왔거나 테스트가 대역을 넣어도 그대로 통하게.
      const { selectorText, style } = rule as CSSStyleRule;
      if (typeof selectorText !== "string" || !style) continue;

      const name = style.getPropertyValue("view-transition-name").trim();
      if (!name || name === "none") continue;

      let count: number;
      try {
        count = doc.querySelectorAll(selectorText).length;
      } catch {
        continue; // 브라우저가 못 읽는 셀렉터는 건너뛴다
      }
      if (count === 0) continue;

      const entry = byName.get(name) ?? { count: 0, selectors: [] };
      entry.count += count;
      entry.selectors.push(selectorText);
      byName.set(name, entry);
    }
  };

  for (const sheet of doc.styleSheets) {
    try {
      visit(sheet.cssRules);
    } catch {
      // 다른 출처(폰트 CDN 등)의 스타일시트는 규칙을 읽을 수 없다 — 우리 것이 아니므로 무시한다.
    }
  }

  return [...byName]
    .filter(([, v]) => v.count > 1)
    .map(([name, v]) => ({ name, count: v.count, selectors: v.selectors }));
}

function reportSkippedTransition(doc: Document, error: unknown): void {
  // 이어지는 이동 때문에 끊긴 것은 정상이다. 조용히 넘긴다.
  if (error instanceof DOMException && error.name === "AbortError") return;

  if (!import.meta.env.DEV) return;

  if (error instanceof DOMException && error.name === "InvalidStateError") {
    const duplicates = findDuplicateNames(doc);
    console.warn(
      "[view-transition] 이름이 겹쳐서 페이지 전환이 통째로 건너뛰어졌다(애니메이션 없음).\n" +
        (duplicates.length > 0
          ? duplicates.map((d) => `  · ${d.name} × ${d.count} — ${d.selectors.join(", ")}`).join("\n")
          : "  전환이 끝난 뒤라 지금은 겹친 이름이 남아 있지 않다. 바로 위 브라우저 로그의\n" +
            "  'Unexpected duplicate view-transition-name' 줄이 어떤 이름인지 알려 준다."),
    );
    return;
  }

  console.warn("[view-transition] 전환이 건너뛰어졌다:", error);
}

/**
 * `document.startViewTransition` 을 한 번 감싸 `ready` 의 rejection 을 받아 준다.
 *
 * 브라우저가 View Transitions 를 모르면 아무 일도 하지 않는다(점진적 향상).
 */
export function installViewTransitionGuard(doc: Document = document): void {
  const original: GuardedStart | undefined = doc.startViewTransition?.bind(doc);
  if (typeof original !== "function") return;
  if ((doc.startViewTransition as GuardedStart)[GUARD_FLAG]) return;

  const guarded: GuardedStart = (...args: Parameters<StartViewTransition>) => {
    const transition = original(...args);
    // `catch` 는 새 프로미스를 만들 뿐 `transition.ready` 자체를 바꾸지 않는다 —
    // 호출자가 `ready` 를 따로 쓰더라도 그쪽 동작은 그대로다.
    transition.ready.catch((error: unknown) => reportSkippedTransition(doc, error));
    return transition;
  };
  guarded[GUARD_FLAG] = true;

  doc.startViewTransition = guarded;
}
