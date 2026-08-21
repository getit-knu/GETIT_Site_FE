/**
 * 어드민 대시보드 타입. API 명세서 5.1 ~ 5.5.
 *
 * BE 의 dashboard 도메인은 아직 골격만 있다. 스키마가 생기면 `generated.ts` 에서 가져온다.
 */

/** 5.1 상단 카운터. */
export interface DashboardSummary {
  totalApplicants: number;
  memberCount: number;
  unEvaluatedAssignmentCount: number;
  unansweredQuestionCount: number;
}

/** 5.2 미확인 Q&A. */
export interface RecentQuestion {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
  /** `n분 전` · `n시간 전` · `n일 전`. **서버가 계산해 내려준다.** */
  elapsedLabel: string;
  lectureTitle: string | null;
}

/** 5.3 주차별 과제 제출 현황. */
export interface WeeklySubmission {
  lectureId: number;
  week: number;
  title: string;
  submittedCount: number;
  totalCount: number;
  /** 0 ~ 100. 서버가 소수 첫째 자리까지 준다. */
  rate: number;
}

export interface SubmissionStatus {
  totalMemberCount: number;
  weeks: WeeklySubmission[];
}

export type EventType = "EVENT" | "COMPETITION";

/** 5.4 행사 일정 D-day. */
export interface UpcomingEvent {
  id: number;
  title: string;
  place: string;
  startDate: string;
  /** 오늘까지 남은 일수. **서버가 계산한다.** */
  dDay: number;
  type: EventType;
}

/** 5.5 진행 중 강의. */
export interface OngoingLecture {
  id: number;
  title: string;
  subCategoryName: string;
  deadline: string;
  submittedCount: number;
  totalCount: number;
}
