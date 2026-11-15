import { useState } from "react";

import { formatWon } from "./festaConfig";
import styles from "./FestaInvestControl.module.scss";

const MAN = 10_000;

interface FestaInvestControlProps {
  title: string;
  amount: number;
  unit: number;
  /** 이 카드에 더 넣을 수 있는 금액(= 남은 투자금). */
  remaining: number;
  /** 우리 조 프로젝트면 조절 대신 안내만 보여준다. */
  isOwn: boolean;
  onChange: (amount: number) => void;
}

/**
 * 카드 아래 투자금 조절(#364). −/+ 는 `unit`(10만 원)씩, 가운데 칸은 만 원 단위로 직접 친다.
 *
 * 직접 치는 값은 칸을 떠날 때 반영한다 — 칠 때마다 단위로 내림하면 "25"를 치는 도중의 "2"가
 * 0원으로 깎여 끝까지 칠 수가 없다.
 */
export function FestaInvestControl({ title, amount, unit, remaining, isOwn, onChange }: FestaInvestControlProps) {
  const [text, setText] = useState<string | null>(null);

  if (isOwn) {
    return <p className={styles.own}>우리 팀 프로젝트라 투자할 수 없어요</p>;
  }

  function commit() {
    if (text === null) return;
    onChange(Number(text || "0") * MAN);
    setText(null);
  }

  return (
    <div className={styles.control}>
      <button
        type="button"
        className={styles.step}
        aria-label={`${title} 투자금 ${formatWon(unit)} 빼기`}
        disabled={amount === 0}
        onClick={() => onChange(amount - unit)}
      >
        −
      </button>
      <label className={styles.field}>
        <input
          className={styles.input}
          inputMode="numeric"
          aria-label={`${title} 투자금(만 원)`}
          value={text ?? String(amount / MAN)}
          onChange={(e) => setText(e.target.value.replace(/\D/g, "").slice(0, 5))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        <span aria-hidden="true">만 원</span>
      </label>
      <button
        type="button"
        className={styles.step}
        aria-label={`${title} 투자금 ${formatWon(unit)} 더하기`}
        disabled={remaining < unit}
        onClick={() => onChange(amount + unit)}
      >
        +
      </button>
    </div>
  );
}
