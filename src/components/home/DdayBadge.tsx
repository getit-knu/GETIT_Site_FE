import { Link } from "react-router";

import { getScheduleSnapshot } from "../../mocks/recruitment/recruitment";

import styles from "./DdayBadge.module.scss";

/** 자정 기준 날짜 차이. 마감 당일에는 시각과 무관하게 "D-DAY"로 보여야 한다. */
function daysUntil(targetISO: string): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(new Date(targetISO)) - startOfDay(new Date())) / 86_400_000);
}

/**
 * 서류 접수 기간에만 보이는 홈 화면 전체 sticky D-Day 배지(#170).
 *
 * 원래 `ProjectShowcase` 섹션 안에 있었는데, 섹션 하나에 갇혀 있으면 스크롤해도
 * 페이지 전체를 따라다닐 수 없어 `HomePage` 레벨로 뺐다.
 */
export function DdayBadge() {
  const schedule = getScheduleSnapshot();
  const now = new Date();

  if (now < new Date(schedule.documentStartAt) || now > new Date(schedule.documentEndAt)) return null;

  const dDay = daysUntil(schedule.documentEndAt);

  return (
    <Link to="/apply" className={styles.badge}>
      <span className={styles.ddayLabel}>{dDay === 0 ? "D-DAY" : `D-${dDay}`}</span>
      <span className={styles.applyCta}>
        지원하기
        <svg className={styles.applyIcon} viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
          <path
            d="M7.5 15L12.5 10L7.5 5"
            stroke="currentColor"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
