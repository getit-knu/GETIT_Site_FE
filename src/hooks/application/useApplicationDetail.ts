import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApplicationDetail, saveEvaluation } from "../../apis/application/applicationsApi";
import { queryKeys } from "../../apis/queryKeys";
import type { ApplicantListParams, EvaluationPayload } from "../../types/application";

/**
 * 지원서 상세. **목록 필터를 함께 넘긴다.**
 * 응답의 `navigation` 이 커서 기반이라 같은 조건에서 계산해야 순서가 목록과 맞는다.
 */
export function useApplicationDetail(id: number | null, params: ApplicantListParams) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id ?? 0, params),
    queryFn: () => getApplicationDetail(id!, params),
    // 모달이 닫혀 있으면 id 가 없다. 그때는 요청하지 않는다.
    enabled: id !== null,
  });
}

export function useSaveEvaluation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EvaluationPayload) => saveEvaluation(id, payload),
    onSuccess: async () => {
      // 평가하면 목록의 총점·평가여부가 바뀐다. 상세만 갱신하면 표가 옛 값을 보여준다.
      await queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    },
  });
}
