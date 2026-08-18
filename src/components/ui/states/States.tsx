import type { ReactNode } from "react";

import styles from "./States.module.scss";

/**
 * 로딩 · 에러 · 빈 상태.
 *
 * 컨벤션상 전 화면 필수라 첫 목록 화면인 Q&A 에서 함께 만든다.
 * **와이어프레임 어느 화면에도 이 세 상태가 그려져 있지 않다.** 자체 설계다.
 */

/** 표가 그려질 자리를 미리 차지한다. 스피너와 달리 화면이 튀지 않는다. */
export function TableSkeleton({ rows = 5, columns }: { rows?: number; columns: number }) {
  return (
    <div className={styles.skeleton} role="status" aria-label="불러오는 중">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={styles.skeletonRow}>
          {Array.from({ length: columns }, (_, c) => (
            <span key={c} className={styles.skeletonCell} />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ErrorStateProps {
  /** 도메인 메시지. 없으면 서버가 준 문구를 그대로 쓴다. */
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.state} role="alert">
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button type="button" className={styles.action} onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className={styles.state}>
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  );
}
