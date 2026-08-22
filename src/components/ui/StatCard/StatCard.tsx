import styles from "./StatCard.module.scss";

/** 와이어프레임 p5 의 카운터 4종. 색은 항목을 구분하려는 것뿐 의미는 없다. */
export type StatTone = "blue" | "green" | "orange" | "purple";

interface StatCardProps {
  label: string;
  value: number;
  tone: StatTone;
  /** 24×24 뷰박스 stroke path. */
  icon: string;
}

export function StatCard({ label, value, tone, icon }: StatCardProps) {
  return (
    <div className={styles.card}>
      <span className={`${styles.icon} ${styles[tone]}`} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d={icon} />
        </svg>
      </span>
      <span className={styles.body}>
        <span className={styles.label}>{label}</span>
        {/* 숫자는 자릿수가 흔들리지 않게 고정폭으로 둔다. */}
        <strong className={styles.value}>{value.toLocaleString("ko-KR")}</strong>
      </span>
    </div>
  );
}
