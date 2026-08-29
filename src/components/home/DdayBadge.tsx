import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { getRecruitmentStatus } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";

import styles from "./DdayBadge.module.scss";

/**
 * 서류 접수 기간에만 보이는 홈 화면 전체 sticky D-Day 배지(#170).
 *
 * 원래 `ProjectShowcase` 섹션 안에 있었는데, 섹션 하나에 갇혀 있으면 스크롤해도
 * 페이지 전체를 따라다닐 수 없어 `HomePage` 레벨로 뺐다.
 *
 * `dDay`·`applyEnabled`는 BE가 계산해서 준다(#187) — 클라이언트에서 날짜를 직접
 * 비교하지 않는다.
 */
export function DdayBadge() {
  const { data } = useQuery({
    queryKey: queryKeys.public.recruitmentStatus(),
    queryFn: getRecruitmentStatus,
  });

  if (data === undefined || !data.applyEnabled || data.dDay === null) return null;

  return (
    <Link to="/apply" className={styles.badge}>
      <span className={styles.ddayLabel}>{data.dDay === 0 ? "D-DAY" : `D-${data.dDay}`}</span>
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
