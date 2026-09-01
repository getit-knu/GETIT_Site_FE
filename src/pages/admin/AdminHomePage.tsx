import { Link } from "react-router";

import { DashboardCard } from "../../components/dashboard/DashboardCard";
import { ListItem } from "../../components/ui/ListItem/ListItem";
import { ProgressBar } from "../../components/ui/ProgressBar/ProgressBar";
import { StatCard, type StatTone } from "../../components/ui/StatCard/StatCard";
import {
  useOngoingLectures,
  useRecentQuestions,
  useSubmissionStatus,
  useSummary,
  useUpcomingEvents,
} from "../../hooks/dashboard/useDashboard";
import type { DashboardSummary } from "../../types/dashboard";

import styles from "./AdminHomePage.module.scss";

const STATS: { key: keyof DashboardSummary; label: string; tone: StatTone; icon: string }[] = [
  {
    key: "totalApplicants",
    label: "총 지원자",
    tone: "blue",
    icon: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7",
  },
  {
    key: "memberCount",
    label: "부원 수",
    tone: "green",
    icon: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 20a6 6 0 0112 0M16 11a3 3 0 100-6M18 20a5 5 0 00-2-4",
  },
  {
    key: "unEvaluatedAssignmentCount",
    label: "미평가 과제",
    tone: "orange",
    icon: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM9 8h7",
  },
  {
    key: "unansweredQuestionCount",
    label: "미답변 Q&A",
    tone: "purple",
    icon: "M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z",
  },
];

/** 와이어프레임 p5. 카드마다 따로 조회해 한 곳이 실패해도 나머지는 보인다. */
export default function AdminHomePage() {
  const summary = useSummary();
  const questions = useRecentQuestions();
  const submissions = useSubmissionStatus();
  const events = useUpcomingEvents();
  const lectures = useOngoingLectures();

  return (
    <div className={styles.page}>
      <DashboardCard
        title="현황"
        query={summary}
        emptyMessage="집계할 데이터가 없습니다."
        // 카운터는 0 이어도 보여줘야 한다. 빈 상태로 치지 않는다.
      >
        {(data) => (
          <div className={styles.stats}>
            {STATS.map((stat) => (
              <StatCard key={stat.key} label={stat.label} value={data[stat.key]} tone={stat.tone} icon={stat.icon} />
            ))}
          </div>
        )}
      </DashboardCard>

      <div className={styles.grid}>
        <DashboardCard
          title="미확인 Q&A"
          action={
            <Link viewTransition className={styles.more} to="/admin/questions?status=PENDING">
              전체 보기
            </Link>
          }
          query={questions}
          isEmpty={(d) => d.length === 0}
          emptyMessage="미확인 질문이 없습니다."
        >
          {(data) => (
            <ul className={styles.list}>
              {data.map((q) => (
                <ListItem
                  key={q.id}
                  tone="blue"
                  title={q.content}
                  meta={`${q.authorName}${q.lectureTitle ? ` · ${q.lectureTitle}` : ""} · ${q.elapsedLabel}`}
                  href={`/admin/questions?modal=answer&id=${q.id}`}
                  linkAs={({ to, className, children }) => (
                    <Link viewTransition to={to} className={className}>
                      {children}
                    </Link>
                  )}
                />
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard
          title="과제 제출 현황"
          query={submissions}
          isEmpty={(d) => d.weeks.length === 0}
          emptyMessage="진행된 주차가 없습니다."
        >
          {(data) => (
            <ul className={styles.list}>
              {data.weeks.map((w) => (
                // 한 강의에 여러 주차가 실릴 수 있다. lectureId 만으로는 key 가 겹친다.
                <li key={`${w.lectureId}-${w.week}`} className={styles.week}>
                  <div className={styles.weekHead}>
                    <span className={styles.weekTitle}>
                      {w.week}주차 · {w.title}
                    </span>
                    <span className={styles.weekCount}>
                      {w.submittedCount}/{w.totalCount}
                    </span>
                  </div>
                  <ProgressBar rate={w.rate} label={`${w.title} 제출률`} />
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard
          title="다가오는 행사"
          query={events}
          isEmpty={(d) => d.length === 0}
          emptyMessage="예정된 행사가 없습니다."
        >
          {(data) => (
            <ul className={styles.list}>
              {data.map((e) => (
                <ListItem
                  key={e.id}
                  tone="yellow"
                  title={e.title}
                  meta={`${e.place} · ${e.startDate}`}
                  // dDay 는 서버가 계산한다. 0 이면 오늘이다.
                  trailing={<span className={styles.dday}>{e.dDay === 0 ? "D-DAY" : `D-${e.dDay}`}</span>}
                />
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard
          title="진행 중 강의"
          action={
            <Link viewTransition className={styles.more} to="/admin/lectures">
              전체 보기
            </Link>
          }
          query={lectures}
          isEmpty={(d) => d.length === 0}
          emptyMessage="진행 중인 강의가 없습니다."
        >
          {(data) => (
            <ul className={styles.list}>
              {data.map((l) => (
                <ListItem
                  key={l.id}
                  tone="gray"
                  title={l.title}
                  meta={`${l.subCategoryName} · 마감 ${l.deadline} · 제출 ${l.submittedCount}/${l.totalCount}`}
                />
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
