/** Home 화면 목 데이터 타입. 실제 API가 생기기 전까지 정적/목업 콘텐츠에 쓴다. */
export interface Activity {
  id: string;
  label: string;
}

export type ScheduleEventTag = "event" | "seminar";

export interface ScheduleEvent {
  id: string;
  day: number;
  title: string;
  date: string;
  tag: ScheduleEventTag;
}

/** `month`는 1~12. 실제 일정 API 연동 전까지 2026년 한 해만 목업으로 둔다. */
export interface MonthlySchedule {
  month: number;
  events: ScheduleEvent[];
}

export interface CurriculumSemester {
  id: string;
  title: string;
  items: string[];
}
