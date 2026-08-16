import styles from "./Pagination.module.scss";

interface PaginationProps {
  /** 0부터 시작한다 (명세서 0.3). 화면에는 +1 해서 보여준다. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="페이지">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 0}>
        이전
      </button>
      <span className={styles.status} aria-live="polite">
        {page + 1} / {totalPages}
      </span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}>
        다음
      </button>
    </nav>
  );
}
