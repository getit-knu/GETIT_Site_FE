import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApplicants, updateStatus } from "../../apis/application/applicationsApi";
import { queryKeys } from "../../apis/queryKeys";
import type { ApplicantListParams } from "../../types/application";

export function useApplicants(params: ApplicantListParams) {
  return useQuery({
    queryKey: queryKeys.applications.list(params),
    queryFn: () => getApplicants(params),
    // 검색어를 치는 동안 표가 빈 화면으로 깜빡이지 않게 이전 결과를 유지한다.
    placeholderData: (previous) => previous,
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, passed }: { id: number; passed: boolean }) => updateStatus(id, passed),
    onSuccess: async () => {
      // 합·불을 정하면 status 도 바뀐다. 상태 필터가 걸려 있으면 그 행이 목록에서 빠진다.
      await queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    },
  });
}
