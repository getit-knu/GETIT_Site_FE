import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAdjacentApplicants,
  getApplicationDetail,
  getEvaluationSummary,
  saveEvaluation,
} from "../../apis/application/applicationsApi";
import { queryKeys } from "../../apis/queryKeys";
import type { ApplicantListParams, EvaluationPayload } from "../../types/application";

export function useApplicationDetail(id: number | null) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id ?? 0),
    queryFn: () => getApplicationDetail(id!),
    // 모달이 닫혀 있으면 id 가 없다. 그때는 요청하지 않는다.
    enabled: id !== null,
  });
}

/** 순차 탐색(7.5). 목록과 같은 조건으로 물어야 이전·다음이 지금 보고 있는 순서와 맞는다. */
export function useAdjacentApplicants(id: number | null, params: ApplicantListParams) {
  return useQuery({
    queryKey: queryKeys.applications.adjacent(id ?? 0, params),
    queryFn: () => getAdjacentApplicants(id!, params),
    enabled: id !== null,
  });
}

export function useEvaluationSummary(id: number | null) {
  return useQuery({
    queryKey: queryKeys.applications.scores(id ?? 0),
    queryFn: () => getEvaluationSummary(id!),
    enabled: id !== null,
  });
}

export function useSaveEvaluation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EvaluationPayload) => saveEvaluation(id, payload),
    onSuccess: async (summary) => {
      queryClient.setQueryData(queryKeys.applications.scores(id), summary);
    },
  });
}
