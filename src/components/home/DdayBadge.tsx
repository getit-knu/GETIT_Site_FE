import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import { getRecruitmentStatus } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import type { RecruitmentPhase } from "../../types/recruitment";

import styles from "./DdayBadge.module.scss";

/**
 * 남은 일수가 **무엇까지** 남은 것인지 (#272).
 *
 * BE 는 단계마다 다음 마일스톤까지의 일수를 준다(`RecruitmentStatusService.resolveDDay`) —
 * `BEFORE_OPEN` 은 서류 시작까지, `DOCUMENT_OPEN` 은 서류 마감까지다. 숫자만 두면 같은
 * `D-4` 가 "나흘 뒤에 열린다" 인지 "나흘 뒤에 닫힌다" 인지 알 수 없다.
 *
 * 여기 없는 단계는 배지를 띄우지 않는다 — 지원자가 할 일이 남아 있는 구간만 따라다닌다.
 */
const COUNTDOWN_LABEL: Partial<Record<RecruitmentPhase, string>> = {
  BEFORE_OPEN: "지원 시작까지",
  DOCUMENT_OPEN: "지원 마감까지",
};

/**
 * 홈 화면 전체를 따라다니는 sticky D-Day 배지(#170).
 *
 * 원래 `ProjectShowcase` 섹션 안에 있었는데, 섹션 하나에 갇혀 있으면 스크롤해도
 * 페이지 전체를 따라갈 수 없어 `HomePage` 레벨로 뺐다.
 *
 * `dDay`·`phase`·`applyEnabled`는 BE가 계산해서 준다 — 클라이언트에서 날짜를 직접
 * 비교하지 않는다.
 *
 * **접수 시작 전에도 보여준다**(#272). 그때는 아직 낼 수 없으므로 링크가 아니다 —
 * 눌러서 "아직 안 열렸습니다" 를 보게 하는 대신 눌리지 않는 것으로 알린다.
 */
export function DdayBadge() {
  const { data } = useQuery({
    queryKey: queryKeys.public.recruitmentStatus(),
    queryFn: getRecruitmentStatus,
  });

  if (data === undefined || data.dDay === null) return null;

  const countdown = COUNTDOWN_LABEL[data.phase];
  if (countdown === undefined) return null;

  const dday = data.dDay === 0 ? "D-DAY" : `D-${data.dDay}`;
  const label = (
    <span className={styles.ddayLabel}>
      {countdown} {dday}
    </span>
  );

  // 스위치를 내려 둔 동안(일시 중지)에도 낼 수 없다. BE 가 applyEnabled 로 알려준다.
  if (!data.applyEnabled) {
    return (
      <div className={styles.badge}>
        {label}
        <span className={styles.pendingCta}>지원 예정</span>
      </div>
    );
  }

  return (
    <Link to="/apply" className={styles.badge}>
      {label}
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
