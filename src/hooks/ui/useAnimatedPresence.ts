import { useEffect, useRef, useState } from "react";

/**
 * 퇴장 애니메이션을 위해 unmount를 늦추는 훅. Modal·Toast·FAQ가 같이 쓴다.
 *
 * `open`이 false가 되면 곧바로 접지 않고 `exiting`만 켜 둔다 — 쓰는 쪽은 `data-exiting`으로
 * CSS 퇴장 애니메이션을 재생하고 `animationend`에서 `endExit()`를 부른다. 애니메이션이 없는
 * 환경(jsdom 등)에서는 `animationend`가 영영 안 오므로 `exitMs` 타임아웃이 폴백으로 접는다.
 *
 * **여는 쪽은 상태를 거치지 않는다.** `mounted`를 `open || closing`으로 파생시켜, 열릴 때는
 * 계산만으로 즉시 true가 된다. 예전에는 여는 것도 렌더 중 `setMounted(true)`로 처리했는데,
 * StrictMode에서 그 업데이트가 반영되지 않고 되돌려지는 경우가 있어 **모달이 아예 안 열렸다**
 * (jsdom에는 StrictMode를 안 씌워 테스트가 놓쳤다). 닫는 쪽만 상태로 남겨 두면, 혹시 같은 일이
 * 생기더라도 최악이 "퇴장 연출 없이 바로 사라짐"이라 못 여는 것보다 훨씬 안전하다.
 */
export function useAnimatedPresence(open: boolean, exitMs = 200) {
  // 닫히는 중에만 켜진다. 열려 있는 동안은 `open` 자체가 답이라 따로 들 필요가 없다.
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const timer = useRef<number | undefined>(undefined);

  // `open`이 바뀐 것을 렌더 중에 반영한다(React 공식 "prop 기반 state 조정" 패턴).
  if (open !== prevOpen) {
    setPrevOpen(open);
    // 닫히기 시작하면 퇴장 구간에 들어가고, 도로 열리면 그 구간을 곧바로 벗어난다.
    setClosing(!open);
  }

  const mounted = open || closing;

  useEffect(() => {
    if (open) return;

    // 퇴장 애니메이션이 끝났다는 신호가 안 올 때를 대비한 폴백.
    timer.current = window.setTimeout(() => setClosing(false), exitMs);
    return () => window.clearTimeout(timer.current);
  }, [open, exitMs]);

  /** 퇴장 애니메이션이 끝났을 때 쓰는 쪽이 부른다. */
  function endExit() {
    if (open) return;
    window.clearTimeout(timer.current);
    setClosing(false);
  }

  return { mounted, exiting: !open && closing, endExit };
}
