import { useQuery } from "@tanstack/react-query";

import {
  getOngoingLectures,
  getRecentQuestions,
  getSubmissionStatus,
  getSummary,
  getUpcomingEvents,
} from "../../apis/dashboard/dashboardApi";
import { queryKeys } from "../../apis/queryKeys";

/**
 * 대시보드 카드별 조회.
 *
 * **하나로 묶지 않는다.** 5개를 한 쿼리로 합치면 한 곳이 실패할 때 화면 전체가 오류가 된다.
 * 카드마다 독립적으로 로딩·실패해야 나머지를 계속 볼 수 있다.
 */
const keys = queryKeys.dashboard;

export const useSummary = () => useQuery({ queryKey: keys.summary(), queryFn: getSummary });

export const useRecentQuestions = () => useQuery({ queryKey: keys.recentQuestions(), queryFn: getRecentQuestions });

export const useSubmissionStatus = () => useQuery({ queryKey: keys.submissionStatus(), queryFn: getSubmissionStatus });

export const useUpcomingEvents = () => useQuery({ queryKey: keys.upcomingEvents(), queryFn: getUpcomingEvents });

export const useOngoingLectures = () => useQuery({ queryKey: keys.ongoingLectures(), queryFn: getOngoingLectures });
