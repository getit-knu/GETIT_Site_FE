import type { MonthlySchedule } from "../../types/home";

/**
 * 2026년 한 해 목업 일정. 실제 일정 API 연동 전까지 커리큘럼(mocks/home/curriculum.ts) 내용과
 * 어울리는 월에 대표 일정 하나씩만 채워둔다. 나머지 달은 빈 배열(일정 없음)이다.
 */
export const SCHEDULE_2026: MonthlySchedule[] = [
  { month: 1, events: [{ id: "new-year-gathering", day: 5, title: "신년 모임", date: "1월 5일", tag: "event" }] },
  { month: 2, events: [] },
  { month: 3, events: [{ id: "getit-chat-spring", day: 12, title: "GETIT Chat", date: "3월 12일", tag: "event" }] },
  {
    month: 4,
    events: [{ id: "sw-education-seminar", day: 9, title: "SW 교육 세미나", date: "4월 9일", tag: "seminar" }],
  },
  {
    month: 5,
    events: [{ id: "startup-hackathon", day: 21, title: "창업 해커톤", date: "5월 21일", tag: "event" }],
  },
  { month: 6, events: [] },
  { month: 7, events: [] },
  { month: 8, events: [] },
  { month: 9, events: [{ id: "getit-chat-fall", day: 10, title: "GETIT Chat", date: "9월 10일", tag: "event" }] },
  { month: 10, events: [{ id: "ideathon", day: 15, title: "아이디어톤", date: "10월 15일", tag: "event" }] },
  { month: 11, events: [{ id: "mvp-showcase", day: 12, title: "MVP 제작 발표", date: "11월 12일", tag: "event" }] },
  { month: 12, events: [] },
];
