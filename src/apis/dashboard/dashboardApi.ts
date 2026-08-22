import * as mock from "../../mocks/dashboard/dashboard";
import type {
  DashboardSummary,
  OngoingLecture,
  RecentQuestion,
  SubmissionStatus,
  UpcomingEvent,
} from "../../types/dashboard";

/**
 * 어드민 대시보드 API. 명세서 5.1 ~ 5.5.
 *
 * **아직 목 데이터를 돌려준다.** 연동 이슈에서 `mock.*` 만 `client.get` 으로 바꾸면 된다.
 */

/** `GET /api/admin/dashboard/summary` */
export const getSummary = (): Promise<DashboardSummary> => mock.fetchSummary();

/** `GET /api/admin/dashboard/recent-questions?size=5` */
export const getRecentQuestions = (): Promise<RecentQuestion[]> => mock.fetchRecentQuestions();

/** `GET /api/admin/dashboard/submission-status?size=5` */
export const getSubmissionStatus = (): Promise<SubmissionStatus> => mock.fetchSubmissionStatus();

/** `GET /api/admin/dashboard/upcoming-events` */
export const getUpcomingEvents = (): Promise<UpcomingEvent[]> => mock.fetchUpcomingEvents();

/** `GET /api/admin/dashboard/ongoing-lectures` */
export const getOngoingLectures = (): Promise<OngoingLecture[]> => mock.fetchOngoingLectures();
