import { client } from "../client";
import type {
  DashboardSummary,
  OngoingLecture,
  RecentQuestion,
  SubmissionStatus,
  UpcomingEvent,
} from "../../types/dashboard";

/** 어드민 대시보드 API. 명세서 5.1 ~ 5.5. */

/** `GET /api/admin/dashboard/summary` */
export async function getSummary(): Promise<DashboardSummary> {
  const { data } = await client.get<DashboardSummary>("/api/admin/dashboard/summary");
  return data;
}

/** `GET /api/admin/dashboard/recent-questions?size=5` */
export async function getRecentQuestions(): Promise<RecentQuestion[]> {
  const { data } = await client.get<RecentQuestion[]>("/api/admin/dashboard/recent-questions");
  return data;
}

/** `GET /api/admin/dashboard/submission-status?trackId=&size=5` */
export async function getSubmissionStatus(): Promise<SubmissionStatus> {
  const { data } = await client.get<SubmissionStatus>("/api/admin/dashboard/submission-status");
  return data;
}

/** `GET /api/admin/dashboard/upcoming-events` */
export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const { data } = await client.get<UpcomingEvent[]>("/api/admin/dashboard/upcoming-events");
  return data;
}

/** `GET /api/admin/dashboard/ongoing-lectures` */
export async function getOngoingLectures(): Promise<OngoingLecture[]> {
  const { data } = await client.get<OngoingLecture[]>("/api/admin/dashboard/ongoing-lectures");
  return data;
}
