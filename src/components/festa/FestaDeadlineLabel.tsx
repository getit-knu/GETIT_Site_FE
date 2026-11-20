import { useEffect, useState } from "react";

import { festaDeadline, formatRemaining, type FestaWindow } from "./festaDeadline";
import styles from "./FestaShowcase.module.scss";

/** 그날 전에는 날짜만 바뀌면 되니 1분마다, 당일에는 초를 보여주니 1초마다 다시 센다. */
const DAYS_TICK_MS = 60_000;
const TODAY_TICK_MS = 1_000;

interface FestaDeadlineLabelProps {
  /** 관리자가 정한 투표 기간(#379). */
  period: FestaWindow;
  /** "투표" 또는 "투자". */
  action: string;
}

/**
 * 쇼케이스 히어로의 기간 표시(#377, #379).
 * - 시작 전: `투표 시작 D-2`, 시작 당일에는 `투표 시작까지 05:12:33`
 * - 진행 중: `투표 마감 D-3`, 마지막 날에는 `마감까지 05:12:33`
 * - 마감 뒤: `투표 마감`
 *
 * 1초마다 다시 그리는 범위를 이 컴포넌트로 좁히려고 쇼케이스 본문과 떼어 두었다.
 */
export function FestaDeadlineLabel({ period, action }: FestaDeadlineLabelProps) {
  const [now, setNow] = useState(() => Date.now());
  const deadline = festaDeadline(now, period);

  useEffect(() => {
    if (deadline.kind === "closed") return;
    const timer = setInterval(() => setNow(Date.now()), deadline.kind === "today" ? TODAY_TICK_MS : DAYS_TICK_MS);
    return () => clearInterval(timer);
  }, [deadline.kind]);

  if (deadline.kind === "closed") return <>{action} 마감</>;
  const verb = deadline.target === "start" ? "시작" : "마감";
  if (deadline.kind === "days") return <>{`${action} ${verb} D-${deadline.days}`}</>;
  return (
    <>
      {deadline.target === "start" ? `${action} 시작까지` : "마감까지"}{" "}
      {/* role="timer"는 기본이 aria-live="off"라 스크린리더가 1초마다 숫자를 읽지 않는다. */}
      <span role="timer" className={styles.timer}>
        {formatRemaining(deadline.remainingMs)}
      </span>
    </>
  );
}
