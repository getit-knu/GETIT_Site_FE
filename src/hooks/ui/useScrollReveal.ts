import { useEffect, useState } from "react";

import { prefersReducedMotion } from "../../libs/prefersReducedMotion";

/**
 * 스크롤 등장(reveal) 훅. 요소가 뷰포트에 처음 들어오는 순간 `revealed`가 true가 되고,
 * 그 뒤로는 다시 숨기지 않는다(스크롤을 되돌릴 때마다 또 나타나면 산만하다).
 *
 * 컴포넌트는 `const [ref, revealed] = useScrollReveal()`로 받아 ref를 등장시킬 요소에 걸고
 * `data-revealed={revealed || undefined}`를 붙인다 — 초기 숨김·전환은 `_motion.scss`의
 * `scroll-reveal` 믹스인이 담당한다. (객체가 아니라 튜플로 돌려주는 건 react-hooks의
 * ref 정적 분석 때문 — `obj.ref` 꼴 접근은 "렌더 중 ref 접근"으로 오인된다.)
 *
 * ref는 useRef가 아니라 **state를 채우는 콜백 ref**다 — 데이터가 온 뒤에야 요소를
 * 렌더하는 섹션(FAQ·쇼케이스 등은 데이터 전엔 null을 반환한다)은 요소가 effect 이후에
 * 붙는데, useRef로는 effect가 다시 돌지 않아 관찰이 영영 시작되지 않는다.
 *
 * IntersectionObserver가 없는 환경(jsdom)이나 동작 줄이기를 켠 사용자에게는 숨겨 둘 이유가
 * 없으므로 처음부터 드러난 상태로 시작한다. CSS 쪽 `prefers-reduced-motion` 처리와 이중
 * 안전장치다.
 */
export function useScrollReveal<T extends HTMLElement>(threshold = 0.15) {
  const [element, setElement] = useState<T | null>(null);
  const [revealed, setRevealed] = useState(() => typeof IntersectionObserver === "undefined" || prefersReducedMotion());

  useEffect(() => {
    if (revealed || element === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      // 요소 상단이 뷰포트 아래쪽 8% 안까지는 들어와야 발동 — 화면 끝에 걸치자마자
      // 재생돼 버리면 정작 사용자가 볼 때는 이미 끝나 있다.
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, revealed, threshold]);

  return [setElement, revealed] as const;
}
