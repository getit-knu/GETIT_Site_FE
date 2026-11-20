const SECOND = 1_000;
const DAY = 86_400_000;
/** 한국 표준시(UTC+9). 서머타임이 없어 고정 오프셋으로 날짜를 셀 수 있다. */
const KST_OFFSET = 9 * 3_600_000;

/**
 * 마감까지 남은 상태(#377).
 * - `days`: 마지막 날 전. 한국 날짜로 마지막 날까지 남은 날 수(`D-3`이면 3).
 * - `lastDay`: 마지막 날 당일. 마감까지 남은 밀리초.
 * - `closed`: 마감 뒤.
 */
export type FestaDeadline =
  { kind: "days"; days: number } | { kind: "lastDay"; remainingMs: number } | { kind: "closed" };

/** 한국 날짜로 몇 번째 날인지. 같은 날이면 같은 값이 나온다. */
function kstDay(time: number): number {
  return Math.floor((time + KST_OFFSET) / DAY);
}

/**
 * 보는 사람 기기의 시간대와 관계없이 한국 날짜로 센다 — 행사는 한국에서 열리고, 해외 시간대 기기에서
 * D-day가 하루 어긋나 보이면 안 된다.
 *
 * `endsAt`은 마지막 날이 끝나는 순간(다음 날 0시)이라, 마지막 날은 `endsAt - 1`이 속한 날이다.
 */
export function festaDeadline(now: number, endsAt: number): FestaDeadline {
  if (now >= endsAt) return { kind: "closed" };
  const days = kstDay(endsAt - 1) - kstDay(now);
  if (days <= 0) return { kind: "lastDay", remainingMs: endsAt - now };
  return { kind: "days", days };
}

/** 남은 시간을 `HH:MM:SS`로. 초는 올림한다 — 0.4초 남았을 때 `00:00:00`이 먼저 뜨지 않게. */
export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / SECOND);
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}
