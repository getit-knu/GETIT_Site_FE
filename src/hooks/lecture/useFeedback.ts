import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "../../apis/lecture/lecturesApi";
import { queryKeys } from "../../apis/queryKeys";

/** 8.7. 제출물을 고르지 않았으면(`null`) 조회하지 않는다. */
export function useSubmissionDetail(id: number | null) {
  return useQuery({
    queryKey: queryKeys.lectures.submission(id ?? 0),
    queryFn: () => api.getSubmissionDetail(id as number),
    enabled: id !== null,
  });
}

/**
 * 8.8 · 8.9. 새로 쓰는 것과 고치는 것을 한 훅에서 가른다.
 *
 * 첫 피드백이 달리면 목록의 '피드백 완료' 와 대시보드의 미평가 건수가 함께 달라진다
 * (명세서 8.8). 강의 쪽 캐시를 통째로 무효화한다.
 */
export function useSaveFeedback(submissionId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedbackId, content }: { feedbackId: number | null; content: string }) =>
      feedbackId === null
        ? api.createFeedback(submissionId as number, content)
        : api.updateFeedback(feedbackId, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lectures.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
