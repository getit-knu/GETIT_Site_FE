import { useEffect, useRef, useState } from "react";

/**
 * 퇴장 애니메이션을 위해 unmount를 늦추는 훅. Modal·Toast가 같이 쓴다.
 *
 * `open`이 false가 되면 `exiting`만 true로 바꾸고 마운트를 유지한다 — 컴포넌트는
 * `data-exiting`으로 CSS 퇴장 애니메이션을 재생하고, `animationend`에서 `endExit()`를
 * 부른다. 애니메이션이 없는 환경(prefers-reduced-motion, jsdom)에서는 `animationend`가
 * 영영 안 오므로 `exitMs` 타임아웃이 폴백으로 unmount한다.
 */
export function useAnimatedPresence(open: boolean, exitMs = 200) {
  const [mounted, setMounted] = useState(open);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (open) {
      window.clearTimeout(timer.current);
      // 열릴 때 즉시 마운트하기 위해 동기적으로 setState 호출
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      return;
    }

    timer.current = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(timer.current);
  }, [open, exitMs]);

  function endExit() {
    if (open) return;
    window.clearTimeout(timer.current);
    setMounted(false);
  }

  return { mounted, exiting: !open && mounted, endExit };
}
