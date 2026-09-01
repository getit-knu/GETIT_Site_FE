import type { ReactNode } from "react";

import styles from "./States.module.scss";

/**
 * 로딩 · 에러 · 빈 상태.
 *
 * 컨벤션상 전 화면 필수라 첫 목록 화면인 Q&A 에서 함께 만든다.
 * **와이어프레임 어느 화면에도 이 세 상태가 그려져 있지 않다.** 자체 설계다.
 *
 * 로딩은 스피너나 "불러오는 중…" 한 줄이 아니라 **곧 올 내용의 모양**으로 그린다. 자리를
 * 미리 차지하므로 응답이 도착해도 화면이 밀리지 않고, 무엇이 오는지도 미리 읽힌다.
 * 모양은 네 가지뿐이다 — 표 · 문단 · 카드 격자 · 폼. 새 화면은 이 중에서 고른다.
 */

const LOADING_LABEL = "불러오는 중";

interface SkeletonProps {
  /**
   * 스크린리더에 읽히는 이름. 한 화면에 스켈레톤이 여럿이면(대시보드 카드 5장처럼)
   * 무엇을 기다리는지 구분되도록 넘긴다.
   */
  label?: string;
  className?: string;
}

/** 표가 그려질 자리를 미리 차지한다. 스피너와 달리 화면이 튀지 않는다. */
export function TableSkeleton({
  rows = 5,
  columns,
  label = LOADING_LABEL,
}: SkeletonProps & { rows?: number; columns: number }) {
  return (
    <div className={`${styles.skeleton} ${styles.reveal}`} role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={styles.skeletonRow}>
          {Array.from({ length: columns }, (_, c) => (
            <span key={c} className={`${styles.block} ${styles.skeletonCell}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * 글이 올 자리. 카드 본문 · 안내 문단 · 목록 한 덩어리처럼 표도 격자도 아닌 곳에 쓴다.
 *
 * `lines` 는 실제로 올 글의 길이에 맞춘다 — 세 줄 자리를 잡아 두고 한 줄이 오면
 * 그만큼 화면이 접힌다.
 */
export function TextSkeleton({ lines = 3, label = LOADING_LABEL, className }: SkeletonProps & { lines?: number }) {
  return (
    <div className={[styles.text, styles.reveal, className].filter(Boolean).join(" ")} role="status" aria-label={label}>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className={`${styles.block} ${styles.textLine}`} />
      ))}
    </div>
  );
}

/**
 * 높이만 잡는 덩어리 하나.
 *
 * 필터 탭 줄처럼 **모양을 흉내 낼 것도 없이 자리만 있으면 되는 띠**에 쓴다. 목록은 로딩
 * 중에도 그리면서 그 위 탭 줄만 데이터가 와야 그릴 수 있는 화면이 있는데(프로젝트 ·
 * 강좌 목록), 그때 이 자리를 비워 두면 응답이 도착하는 순간 목록이 통째로 아래로 밀린다.
 */
export function BlockSkeleton({
  height,
  width,
  label = LOADING_LABEL,
  className,
}: SkeletonProps & { height: string; width?: string }) {
  return (
    <div className={[styles.reveal, className].filter(Boolean).join(" ")} role="status" aria-label={label}>
      <span className={styles.block} style={{ height, width: width ?? "100%" }} />
    </div>
  );
}

/**
 * 카드 격자.
 *
 * **`className` 으로 화면의 실제 격자 클래스를 넘긴다.** 열 수와 간격이 화면마다 달라
 * (프로젝트는 `auto-fit`, 강좌 목록은 고정 4열) 여기서 하나로 정해 두면 로딩이 끝나는
 * 순간 카드가 재배치되며 화면이 튄다. 넘기지 않으면 무난한 기본 격자를 쓴다.
 *
 * `height` 도 그 화면 카드의 실제 높이에 맞춘다 — 이 둘이 어긋나면 스켈레톤을 쓰는
 * 이유(자리를 미리 잡는 것) 자체가 사라진다.
 */
export function CardGridSkeleton({
  count = 6,
  height,
  label = LOADING_LABEL,
  className,
}: SkeletonProps & { count?: number; height: string }) {
  return (
    <div className={styles.reveal} role="status" aria-label={label}>
      <ul className={className ?? styles.cardGrid}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} style={{ height }}>
            <span className={`${styles.block} ${styles.card}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 라벨 + 입력칸 쌍이 올 자리. 지원서 · 강의 등록처럼 폼이 통째로 늦게 오는 화면에 쓴다. */
export function FormSkeleton({ fields = 4, label = LOADING_LABEL, className }: SkeletonProps & { fields?: number }) {
  return (
    <div className={[styles.form, styles.reveal, className].filter(Boolean).join(" ")} role="status" aria-label={label}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className={styles.formField}>
          <span className={`${styles.block} ${styles.formLabel}`} />
          <span className={`${styles.block} ${styles.formInput}`} />
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
