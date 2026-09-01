import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMyProjects, submitProject } from "../../apis/project/memberProjectsApi";
import { queryKeys } from "../../apis/queryKeys";

/** 내 조가 낸 프로젝트 전체(#296). 등록·반려 여부에 따라 상태 배지·반려 사유를 함께 보여준다. */
export function useMyProjects() {
  return useQuery({
    queryKey: queryKeys.member.myProjects(),
    queryFn: getMyProjects,
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
