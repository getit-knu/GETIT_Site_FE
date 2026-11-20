import { useEffect, useState } from "react";

import { festaDeadline, formatRemaining } from "./festaDeadline";
import styles from "./FestaShowcase.module.scss";

/** 마지막 날 전에는 날짜만 바뀌면 되니 1분마다, 마지막 날에는 초를 보여주니 1초마다 다시 센다. */
const DAYS_TICK_MS = 60_000;
const LAST_DAY_TICK_MS = 1_000;

interface FestaDeadlineLabelProps {
  /** 마감 시각(ISO 문자열). */
  endsAt: string;
  /** "투표" 또는 "투자". */
  action: string;
}

/**
 * 쇼케이스 히어로의 마감 표시(#377). 마지막 날 전에는 `투표 마감 D-3`, 마지막 날에는 남은 시간을
 * `마감까지 05:12:33`처럼 1초마다 줄여 보여주고, 마감 뒤에는 `투표 마감`을 보여준다.
 *
 * 1초마다 다시 그리는 범위를 이 컴포넌트로 좁히려고 쇼케이스 본문과 떼어 두었다.
 */
export function FestaDeadlineLabel({ endsAt, action }: FestaDeadlineLabelProps) {
  const end = Date.parse(endsAt);
  const [now, setNow] = useState(() => Date.now());
  const deadline = festaDeadline(now, end);

  useEffect(() => {
    if (deadline.kind === "closed") return;
    const timer = setInterval(() => setNow(Date.now()), deadline.kind === "lastDay" ? LAST_DAY_TICK_MS : DAYS_TICK_MS);
    return () => clearInterval(timer);
  }, [deadline.kind]);

  if (deadline.kind === "closed") return <>{action} 마감</>;
  if (deadline.kind === "days") return <>{`${action} 마감 D-${deadline.days}`}</>;
  return (
    <>
      마감까지 {/* role="timer"는 기본이 aria-live="off"라 스크린리더가 1초마다 숫자를 읽지 않는다. */}
      <span role="timer" className={styles.timer}>
        {formatRemaining(deadline.remainingMs)}
      </span>
    </>
  );
}
