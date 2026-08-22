import styles from "./ProgressBar.module.scss";

/**
 * 비율 막대. **색이 비율에 따라 바뀐다** (와이어프레임 p5 — 93% 초록 / 87%·79% 노랑).
 *
 * 경계값이 명세에 없어 와이어프레임에서 역산했다. 90 이상이 초록, 70 이상이 노랑,
 * 그 아래가 빨강이다. 기준이 정해지면 여기만 고치면 된다.
 */
function toneOf(rate: number): "good" | "warn" | "bad" {
  if (rate >= 90) return "good";
  if (rate >= 70) return "warn";
  return "bad";
}

interface ProgressBarProps {
  /** 0 ~ 100. */
  rate: number;
  /** 스크린리더가 무엇의 비율인지 알 수 있어야 한다. */
  label: string;
}

export function ProgressBar({ rate, label }: ProgressBarProps) {
  // 서버 값이 범위를 벗어나도 막대가 넘치지 않게 한다.
  //
  // `Math.min` · `Math.max` 는 NaN 을 그대로 통과시킨다. 그러면 `width: NaN%` 와
  // `aria-valuenow="NaN"` 이 그려져 막대가 사라지고 낭독기도 값을 읽지 못한다.
  // 나눗셈 결과나 서버 값이 숫자가 아닐 수 있으므로 먼저 거른다.
  const clamped = Number.isFinite(rate) ? Math.min(100, Math.max(0, rate)) : 0;

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className={`${styles.fill} ${styles[toneOf(clamped)]}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
