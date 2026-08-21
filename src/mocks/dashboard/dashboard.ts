import type {
  DashboardSummary,
  OngoingLecture,
  RecentQuestion,
  SubmissionStatus,
  UpcomingEvent,
} from "../../types/dashboard";

/** BE 의 dashboard 도메인이 아직 골격만 있어 화면을 먼저 만든다. */
const delay = () => new Promise((r) => setTimeout(r, 200));

export async function fetchSummary(): Promise<DashboardSummary> {
  await delay();
  return {
    totalApplicants: 124,
    memberCount: 48,
    unEvaluatedAssignmentCount: 23,
    unansweredQuestionCount: 8,
  };
}

export async function fetchRecentQuestions(): Promise<RecentQuestion[]> {
  await delay();
  return [
    {
      id: 7010,
      authorName: "김부원",
      content: "과제 제출 기한 문의",
      createdAt: "2026-01-01T06:04:22.000Z",
      elapsedLabel: "1시간 전",
      lectureTitle: null,
    },
    {
      id: 7011,
      authorName: "이회원",
      content: "강의 자료 다운로드 문의",
      createdAt: "2026-01-01T04:04:22.000Z",
      elapsedLabel: "3시간 전",
      lectureTitle: "HTML/CSS 기초",
    },
  ];
}

export async function fetchSubmissionStatus(): Promise<SubmissionStatus> {
  await delay();
  return {
    totalMemberCount: 48,
    weeks: [
      { lectureId: 101, week: 1, title: "Python 기초", submittedCount: 45, totalCount: 48, rate: 93.8 },
      { lectureId: 102, week: 2, title: "데이터 분석", submittedCount: 42, totalCount: 48, rate: 87.5 },
      { lectureId: 103, week: 3, title: "금융 이론", submittedCount: 38, totalCount: 48, rate: 79.2 },
    ],
  };
}

/**
 * 오늘로부터 `dDay` 일 뒤 날짜. **`startDate` 와 `dDay` 를 따로 적으면 서로 어긋난다.**
 * 서버는 둘을 같은 기준일에서 계산하므로 목도 같게 맞춘다.
 */
function upcoming(dDay: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dDay);
  return date.toISOString().slice(0, 10);
}

export async function fetchUpcomingEvents(): Promise<UpcomingEvent[]> {
  await delay();
  return [
    { id: 11, title: "GETIT Chat", place: "IT5호관 312호", startDate: upcoming(7), dDay: 7, type: "EVENT" },
    {
      id: 12,
      title: "GETIT 해커톤 대회",
      place: "IT5호관 312호",
      startDate: upcoming(14),
      dDay: 14,
      type: "COMPETITION",
    },
  ];
}

export async function fetchOngoingLectures(): Promise<OngoingLecture[]> {
  await delay();
  return [
    {
      id: 210,
      title: "창업 빌드업 4차시",
      subCategoryName: "창업 빌드업",
      deadline: "2026-09-01",
      submittedCount: 12,
      totalCount: 48,
    },
  ];
}
