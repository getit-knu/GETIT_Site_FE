import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "../../apis/site/siteApi";
import { queryKeys } from "../../apis/queryKeys";

/** 모집 일정 · 강의 분류 · FAQ. 아직 실제 엔드포인트가 없어 한 덩어리로 오간다. */
export function useSiteSettings() {
  return useQuery({ queryKey: queryKeys.site.settings(), queryFn: api.getSiteSettings });
}

export function useSaveSiteSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.saveSiteSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.site.all });
    },
  });
}

export function useGeneration() {
  return useQuery({ queryKey: queryKeys.site.generation(), queryFn: api.getGeneration });
}

/**
 * 진행 기수 저장.
 *
 * 새 기수를 활성화하면 기존 활성 기수가 내려간다. 공개 홈·대시보드의 D-day 도
 * 이 값을 기준으로 하므로 함께 무효화한다.
 */
export function useSaveGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.saveGeneration,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.site.generation() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
