import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMyProjects, submitProject } from "../../apis/project/memberProjectsApi";
import { queryKeys } from "../../apis/queryKeys";

/**
 * 내 조가 낸 프로젝트 전체(#296). 등록·반려 여부에 따라 상태 배지·반려 사유를 함께 보여준다.
 *
 * 부원 전용 API 라 GUEST 도 오는 화면(FESTA 쇼케이스)에서는 `enabled`로 막는다.
 */
export function useMyProjects({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.member.myProjects(),
    queryFn: getMyProjects,
    enabled,
  });
}

/** 등록에 성공하면 "내가 낸 프로젝트" 목록을 다시 받아 화면에 바로 반영한다(#296). */
export function useSubmitProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.member.myProjects() });
    },
  });
}
