import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../apis/queryKeys";
import {
  approveProject,
  createProject,
  deleteProject,
  getProjects,
  rejectProject,
  updateProject,
} from "../../apis/project/projectsApi";
import type { AdminProjectListParams, AdminProjectPayload } from "../../types/project";

export function useProjectBoard(params: AdminProjectListParams) {
  return useQuery({
    queryKey: queryKeys.projects.board(params),
    queryFn: () => getProjects(params),
    // 페이지 · 필터를 넘길 때 표가 빈 화면으로 깜빡이지 않게 이전 결과를 유지한다.
    placeholderData: (previous) => previous,
  });
}

function useProjectMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

/** `id` 유무로 생성·수정을 가른다 — 폼은 한 벌만 있으면 된다. */
export const useSaveProject = () =>
  useProjectMutation(({ id, payload }: { id: number | null; payload: AdminProjectPayload }) =>
    id === null ? createProject(payload) : updateProject(id, payload),
  );

export const useDeleteProject = () => useProjectMutation((id: number) => deleteProject(id));

/** 승인 · 반려(#148). 둘 다 목록을 다시 받아 상태 배지와 버튼이 함께 바뀐다. */
export const useApproveProject = () => useProjectMutation((id: number) => approveProject(id));

export const useRejectProject = () => useProjectMutation((id: number) => rejectProject(id));
