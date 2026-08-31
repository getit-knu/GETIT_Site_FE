import clsx from "clsx";

import { memberErrorMessage } from "../../errors/member/errorMessages";
import { useMySummary } from "../../hooks/member/useMemberSummary";
import type { LectureBrief } from "../../types/member";
import { MyQuestionsCard } from "../../components/member/MyQuestionsCard";
import { ErrorState } from "../../components/ui/states/States";

import styles from "./DashboardPage.module.scss";

function LectureHistoryGroup({
  label,
  tone,
  lectures,
}: {
  label: string;
  tone: "danger" | "warning";
  lectures: LectureBrief[];
}) {
  return (
    <div className={styles.historyGroup}>
      <p className={styles.historyStatus}>
        {label}: <strong className={styles[tone]}>{lectures.length}회</strong>
      </p>
      {lectures.length > 0 && (
        <ul className={styles.lectureList}>
          {lectures.map((lecture) => (
            <li key={lecture.lectureId} className={styles.lectureItem}>
              Week {lecture.week} · {lecture.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 부원 대시보드. `MyPage`(내 정보)에서 학습 통계·과제 제출 내역만 분리했다(#239). */
export default function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useMySummary();

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (isError) return <ErrorState message={memberErrorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>대시보드</h1>

        <div className={styles.statsCard}>
          <h3 className={styles.sectionTitle}>학습 통계</h3>
          <div className={styles.statsGrid}>
            <div className={clsx(styles.statBox, styles.statBlue)}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <path
                  d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5V5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5V5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <strong className={styles.statValue}>{data.stats.enrolledLectureCount}</strong>
              <p className={styles.statLabel}>수강한 강의</p>
            </div>

            <div className={clsx(styles.statBox, styles.statGreen)}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M8.5 13.5 7 21l5-2.5 5 2.5-1.5-7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <strong className={styles.statValue}>{data.stats.submittedAssignmentCount}</strong>
              <p className={styles.statLabel}>제출한 과제</p>
            </div>
          </div>
        </div>

        <div className={styles.historyCard}>
          <h3 className={styles.sectionTitleSm}>과제 제출 내역</h3>
          <LectureHistoryGroup label="미제출" tone="danger" lectures={data.notSubmittedLectures} />
          <LectureHistoryGroup label="지각 제출" tone="warning" lectures={data.lateSubmittedLectures} />
        </div>

        <MyQuestionsCard />
      </div>
    </div>
  );
}
