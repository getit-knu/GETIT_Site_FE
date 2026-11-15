import type { FestaInvestState } from "../../hooks/festa/useFestaInvestment";
import { Button } from "../ui/Button/Button";

import { formatWon } from "./festaConfig";
import styles from "./FestaInvestBar.module.scss";

interface FestaInvestBarProps {
  invest: FestaInvestState;
}

/**
 * 화면 아래에 붙어 따라오는 남은 투자금과 저장 버튼(#364). 카드를 내려가며 금액을 고치는 동안
 * 얼마 남았는지 계속 보여야 해서 위쪽 패널과 떼어 놓았다.
 */
export function FestaInvestBar({ invest }: FestaInvestBarProps) {
  if (invest.phase !== "ready") return null;

  const usedRatio = invest.budget === 0 ? 0 : (invest.budget - invest.remaining) / invest.budget;
  const message = invest.saveError ?? (invest.justSaved ? "저장했어요." : invest.blockReason);

  return (
    <div className={styles.bar}>
      <div className={styles.summary}>
        <p className={styles.remaining}>
          남은 투자금 <strong>{formatWon(invest.remaining)}</strong>
          <span className={styles.budget}> / {formatWon(invest.budget)}</span>
        </p>
        <div
          className={styles.track}
          role="progressbar"
          aria-label="투자한 금액"
          aria-valuemin={0}
          aria-valuemax={invest.budget}
          aria-valuenow={invest.budget - invest.remaining}
          aria-valuetext={`${formatWon(invest.budget - invest.remaining)} 투자함`}
        >
          <span className={styles.fill} style={{ width: `${usedRatio * 100}%` }} />
        </div>
        {message !== null && (
          <p className={styles.message} role={invest.saveError ? "alert" : "status"}>
            {message}
          </p>
        )}
      </div>
      <Button onClick={invest.submit} disabled={invest.blockReason !== null || invest.isSaving}>
        {invest.isSaving ? "저장하는 중…" : "투자 저장"}
      </Button>
    </div>
  );
}
