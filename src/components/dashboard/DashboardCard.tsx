import type { ReactNode } from "react";

import { EmptyState, ErrorState } from "../ui/states/States";

import styles from "./DashboardCard.module.scss";

interface DashboardCardProps<T> {
  title: string;
  /** 우측 상단 링크(선택). "전체 보기" 같은 것. */
  action?: ReactNode;
  query: { data: T | undefined; isPending: boolean; isError: boolean; refetch: () => unknown };
  /** 데이터가 비었는지 판단한다. 배열이면 길이, 객체면 내부 값을 본다. */
  isEmpty?: (data: T) => boolean;
  emptyMessage: string;
  children: (data: T) => ReactNode;
}

/**
 * 대시보드 카드 한 장.
 *
 * **상태 처리를 카드가 떠안는다.** 페이지에서 5개 카드의 로딩·에러를 각각 분기하면
 * 같은 코드가 다섯 벌 생기고, 한 곳이 실패했을 때 화면 전체를 오류로 만들기 쉽다.
 */
export function DashboardCard<T>({ title, action, query, isEmpty, emptyMessage, children }: DashboardCardProps<T>) {
  const { data, isPending, isError, refetch } = query;

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {action}
      </header>

      <div className={styles.body}>
        {isPending && <p className={styles.loading}>불러오는 중…</p>}
        {isError && <ErrorState message={`${title}을(를) 불러오지 못했습니다.`} onRetry={() => void refetch()} />}
        {data !== undefined && (isEmpty?.(data) ? <EmptyState message={emptyMessage} /> : children(data))}
      </div>
    </section>
  );
}
