import type { ReactNode } from "react";
import clsx from "clsx";

import { memberErrorMessage } from "../../errors/member/errorMessages";
import { useMySummary } from "../../hooks/member/useMemberSummary";
import type { LectureBrief } from "../../types/member";
import { MyQuestionsCard } from "../../components/member/MyQuestionsCard";
import { ErrorState, TextSkeleton } from "../../components/ui/states/States";

import styles from "./DashboardPage.module.scss";

/**
 * 제목까지 지우고 기다리지 않는다 — "대시보드"는 조회 결과와 무관하게 이미 정해진 글이라,
 * 로딩·에러·본문이 같은 껍데기를 공유하면 응답이 도착해도 제목이 제자리에 그대로 있다.
 */
function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>대시보드</h1>
        {children}
      </div>
    </div>
  );
}

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

  // 통계 카드 두 칸과 과제 내역 몇 줄이 온다.
  if (isPending)
    return (
      <DashboardShell>
        <TextSkeleton lines={6} label="대시보드 불러오는 중" />
      </DashboardShell>
    );
  if (isError)
    return (
      <DashboardShell>
        <ErrorState message={memberErrorMessage(error)} onRetry={() => void refetch()} />
      </DashboardShell>
    );

  return (
    <DashboardShell>
      <>
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
      </>
    </DashboardShell>
  );
}
