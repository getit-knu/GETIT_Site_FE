import type { FestaSchedule } from "../../types/festa";

const SECOND = 1_000;
const DAY = 86_400_000;
/** 한국 표준시(UTC+9). 서머타임이 없어 고정 오프셋으로 날짜를 셀 수 있다. */
const KST_OFFSET = 9 * 3_600_000;

/**
 * 투표 기간 단계(#379). 관리자가 정한 시작·종료로 나뉘고, 기간을 정하지 않았으면 `unscheduled`다 —
 * 그때는 서버도 토글만 보고 투표를 받으므로 화면도 막지 않는다.
 */
export type FestaPhase = "unscheduled" | "before" | "open" | "closed";

/**
 * 히어로에 보여줄 남은 시간(#377, #379). `target`은 시작 전이면 시작, 진행 중이면 마감이다.
 * - `days`: 그날까지 한국 날짜로 남은 날 수(`D-3`이면 3).
 * - `today`: 그날 당일. 남은 밀리초.
 * - `closed`: 마감 뒤.
 */
export type FestaDeadline =
  | { kind: "days"; target: "start" | "end"; days: number }
  | { kind: "today"; target: "start" | "end"; remainingMs: number }
  | { kind: "closed" };

/** 시각(ms)으로 바꾼 투표 기간. */
export interface FestaWindow {
  start: number;
  end: number;
}

export function toWindow(schedule: FestaSchedule): FestaWindow {
  return { start: Date.parse(schedule.startAt), end: Date.parse(schedule.endAt) };
}

/** 한국 날짜로 몇 번째 날인지. 같은 날이면 같은 값이 나온다. */
function kstDay(time: number): number {
  return Math.floor((time + KST_OFFSET) / DAY);
}

export function festaPhase(now: number, period: FestaWindow | null): FestaPhase {
  if (period === null) return "unscheduled";
  if (now < period.start) return "before";
  return now < period.end ? "open" : "closed";
}

/**
 * 기간 밖이라 참여를 막는 이유(#379). `action`은 "투표" 또는 "투자"다. 기간 안이거나 기간을 정하지
 * 않았으면 `null`이다.
 */
export function phaseLockReason(phase: FestaPhase, period: FestaWindow | null, action: string): string | null {
  if (phase === "before" && period !== null) return `${action}는 ${formatKstDateTime(period.start)}에 시작해요.`;
  if (phase === "closed") return `${action}가 마감됐어요.`;
  return null;
}

/**
 * 보는 사람 기기의 시간대와 관계없이 한국 날짜로 센다 — 행사는 한국에서 열리고, 해외 시간대 기기에서
 * D-day가 하루 어긋나 보이면 안 된다.
 *
 * 마감은 그 시각부터 받지 않는 경계라서, 마지막 날은 `end - 1`이 속한 날이다. 자정(다음 날 0시) 마감이면
 * 전날이 마지막 날이고, 18:00 마감이면 그날이 마지막 날이다.
 */
export function festaDeadline(now: number, period: FestaWindow): FestaDeadline {
  if (now >= period.end) return { kind: "closed" };
  const target = now < period.start ? "start" : "end";
  const at = target === "start" ? period.start : period.end;
  const days = kstDay(target === "start" ? period.start : period.end - 1) - kstDay(now);
  if (days <= 0) return { kind: "today", target, remainingMs: at - now };
  return { kind: "days", target, days };
}

/** 남은 시간을 `HH:MM:SS`로. 초는 올림한다 — 0.4초 남았을 때 `00:00:00`이 먼저 뜨지 않게. */
export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / SECOND);
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

const KST_DATE_TIME = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** `11월 23일 10:00`. 시작 전 안내 문구에 쓴다. */
export function formatKstDateTime(time: number): string {
  return KST_DATE_TIME.format(time);
}
