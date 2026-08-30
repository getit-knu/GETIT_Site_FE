import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "../../apis/site/siteApi";
import { queryKeys } from "../../apis/queryKeys";
import type { FeatureToggle, Staff, StaffPayload, StaffSection } from "../../types/site";

export function useStaffs() {
  return useQuery({ queryKey: queryKeys.site.staffs(), queryFn: api.getStaffs });
}

/** 10.21. `id` 유무로 생성·수정을 가른다 — 폼은 한 벌만 있으면 된다. */
export function useSaveStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: StaffPayload }) =>
      id === null ? api.createStaff(payload) : api.updateStaff(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.site.staffs() });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteStaff(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.site.staffs() });
    },
  });
}

/**
 * 10.22 순서 변경.
 *
 * **화면을 먼저 바꾸고 실패하면 되돌린다.** 응답을 기다렸다 옮기면 버튼을 눌러도
 * 한참 아무 일이 없어 사용자가 다시 누르게 된다. 실패했는데 바뀐 채로 두면
 * 저장된 줄 알고 화면을 떠난다.
 */
export function useReorderStaffs() {
  const queryClient = useQueryClient();
  const key = queryKeys.site.staffs();

  return useMutation({
    mutationFn: ({ section, orderedIds }: { section: StaffSection; orderedIds: number[] }) =>
      api.reorderStaffs(section, orderedIds),

    onMutate: async ({ orderedIds }) => {
      // 진행 중인 조회가 뒤늦게 끝나면 낙관적으로 바꿔 둔 값을 덮어쓴다.
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Staff[]>(key);

      // 다른 구역 사람은 `orderedIds` 에 없어 `indexOf` 가 -1 을 준다. 구역을 따로 걸러낼 필요가 없다.
      queryClient.setQueryData<Staff[]>(key, (old) =>
        old?.map((staff) => {
          const at = orderedIds.indexOf(staff.id);
          return at === -1 ? staff : { ...staff, order: at + 1 };
        }),
      );

      return { previous };
    },

    onError: (_error, _vars, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(key, context.previous);
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useFeatures() {
  return useQuery({ queryKey: queryKeys.site.features(), queryFn: api.getFeatures });
}

/**
 * 10.24 기능 토글.
 *
 * **켜진 것처럼 보이는데 안 켜져 있으면 안 된다.** 이 값은 공개 사이트 노출을 제어해서
 * (`GET /public/home` 의 `features`) 잘못 켜면 미완성 화면이 외부에 나간다.
 * 화면을 먼저 바꾸되 실패하면 반드시 되돌린다.
 */
export function useToggleFeature() {
  const queryClient = useQueryClient();
  const key = queryKeys.site.features();

  return useMutation({
    mutationFn: ({ featureKey, enabled }: { featureKey: FeatureToggle["key"]; enabled: boolean }) =>
      api.toggleFeature(featureKey, enabled),

    onMutate: async ({ featureKey, enabled }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FeatureToggle[]>(key);

      queryClient.setQueryData<FeatureToggle[]>(key, (old) =>
        old?.map((feature) => (feature.key === featureKey ? { ...feature, enabled } : feature)),
      );

      return { previous };
    },

    onError: (_error, _vars, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(key, context.previous);
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
