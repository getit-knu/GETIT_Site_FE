import { useEffect, useState } from "react";

import { festaPhase, type FestaPhase, type FestaWindow } from "./festaDeadline";

/**
 * 경계가 멀어도 이 간격으로는 다시 잰다. 쇼케이스를 오래 열어 둔 사이 관리자가 기간을 새로 정하면
 * 마지막으로 잰 시각이 낡아 있을 수 있어서다.
 */
const MAX_DELAY_MS = 60_000;

/**
 * 지금 투표 기간의 어느 단계인지(#379). 다음 경계(시작 또는 마감) 시각이나 1분 중 이른 쪽에 맞춘 타이머
 * 하나로만 다시 잰다 — 쇼케이스 본문이 1초마다 다시 그려지지 않게, 초 단위 표시는 `FestaDeadlineLabel`이
 * 따로 맡는다.
 */
export function useFestaPhase(period: FestaWindow | null): FestaPhase {
  const [now, setNow] = useState(() => Date.now());
  const phase = festaPhase(now, period);

  const start = period?.start;
  const end = period?.end;
  useEffect(() => {
    if (start === undefined || end === undefined) return;
    const current = Date.now();
    const next = [start, end].find((boundary) => boundary > current);
    if (next === undefined) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.min(next - current, MAX_DELAY_MS));
    return () => clearTimeout(timer);
  }, [start, end, now]);

  return phase;
}
