import type { MouseEvent } from "react";

import { useDecideApplication } from "../../hooks/application/useApplicants";
import type { ApplicationStatus } from "../../types/application";

import styles from "./ApplicantsTab.module.scss";

/**
 * 다음 결정 단계. `SUBMITTED`→서류 합·불, `DOC_PASS`→최종 합·불(BE `nextDecisionStatus`와
 * 같은 규칙). 그 외 상태(`DOC_FAIL`·`FINAL_PASS`·`FINAL_FAIL`)는 이미 끝난 결정이라 없다.
 */
function nextDecisionLabels(status: ApplicationStatus): { pass: string; fail: string } | null {
  if (status === "SUBMITTED") return { pass: "서류 합격", fail: "서류 불합격" };
  if (status === "DOC_PASS") return { pass: "최종 합격", fail: "최종 불합격" };
  return null;
}

interface DecisionButtonsProps {
  id: number;
  name: string;
  status: ApplicationStatus;
  /** 모달 안에서 결정한 뒤에는 화면을 닫는다. 목록 행에서는 필요 없다. */
  onDecided?: () => void;
}

/**
 * 지원자 한 명의 합·불 처리 버튼. 목록 행·상세 모달 둘 다에서 쓴다.
 *
 * **어드민 여러 명이 같은 지원자를 동시에 열어 볼 수 있다** — `PATCH .../decision`은
 * 현재 상태 기준으로만 처리하므로(BE `decide()` 확인함), 실패해도 목록을 다시 불러오면
 * 최신 상태가 반영된다.
 */
export function DecisionButtons({ id, name, status, onDecided }: DecisionButtonsProps) {
  const decide = useDecideApplication();
  const labels = nextDecisionLabels(status);

  if (!labels) return <span className={styles.none}>—</span>;

  function handleClick(passed: boolean) {
    return (e: MouseEvent) => {
      e.stopPropagation();
      decide.mutate({ id, passed }, onDecided ? { onSuccess: onDecided } : undefined);
    };
  }

  return (
    <div className={styles.decision}>
      <button
        type="button"
        className={styles.pass}
        aria-label={`${name} ${labels.pass} 처리`}
        disabled={decide.isPending}
        onClick={handleClick(true)}
      >
        {labels.pass}
      </button>
      <button
        type="button"
        className={styles.fail}
        aria-label={`${name} ${labels.fail} 처리`}
        disabled={decide.isPending}
        onClick={handleClick(false)}
      >
        {labels.fail}
      </button>
    </div>
  );
}
