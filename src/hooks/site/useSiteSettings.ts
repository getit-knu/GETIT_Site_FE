import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "../../apis/site/siteApi";
import { queryKeys } from "../../apis/queryKeys";

export function useSiteSettings() {
  return useQuery({ queryKey: queryKeys.site.settings(), queryFn: api.getSiteSettings });
}

/**
 * 10.20 일괄 저장.
 *
 * 진행 기수·모집 일정이 바뀌면 공개 홈과 대시보드의 D-day 도 더는 맞지 않는다.
 */
export function useSaveSiteSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.saveSiteSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.site.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
