import type { components } from "../../apis/generated";

/** 어드민 대시보드 타입. `apis/generated.ts`에서 재노출한다(#217). API 명세서 5.1 ~ 5.5. */

/** 5.1 상단 카운터. */
export type DashboardSummary = Required<components["schemas"]["DashboardSummaryResult"]>;

/** 5.2 미확인 Q&A. `lectureTitle`은 강의 Q&A 가 아니면 실제로 `null`이 온다(BE 확인함) — 손으로 되돌린다. */
export type RecentQuestion = Omit<Required<components["schemas"]["RecentQuestionResult"]>, "lectureTitle"> & {
  lectureTitle: string | null;
};

/** 5.3 주차별 과제 제출 현황. */
export type WeeklySubmission = Required<components["schemas"]["SubmissionStatusResultWeekStat"]>;

/** `Required<>`는 배열 원소 내부까지 못 채우므로 `WeeklySubmission`으로 직접 합성한다. */
export interface SubmissionStatus {
  totalMemberCount: number;
  weeks: WeeklySubmission[];
}

export type EventType = NonNullable<components["schemas"]["UpcomingEventResult"]["type"]>;

/** 5.4 행사 일정 D-day. */
export type UpcomingEvent = Required<components["schemas"]["UpcomingEventResult"]>;

/** 5.5 진행 중 강의. */
export type OngoingLecture = Required<components["schemas"]["OngoingLectureResult"]>;
