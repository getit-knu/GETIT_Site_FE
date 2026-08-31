import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "../../apis/group/groupsApi";
import { queryKeys } from "../../apis/queryKeys";

export function useGroupBoard() {
  return useQuery({ queryKey: queryKeys.groups.board(), queryFn: api.getGroups });
}

/**
 * 조를 고치는 동작들.
 *
 * **하나만 바꿔도 전체를 다시 받는다.** 조원을 옮기면 조 목록과 미배정 목록이 함께
 * 달라지는데, 응답이 한 덩어리라 부분 갱신을 흉내 내면 두 쪽이 어긋나기 쉽다.
 *
 * `users.all`도 함께 무효화한다 — 사용자 관리 탭(`MembersTab`)의 "조" 칸이 각 사용자의
 * `group` 값을 보여주는데, 여기서 조원을 옮겨도 그 칸은 서로 다른 쿼리 키라 갱신 전까지
 * 낡은 채로 남는다(반대 방향은 `useUserMutation`에서 처리).
 */
function useBoardMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
      ]);
    },
  });
}

export const useCreateGroup = () => useBoardMutation((name: string) => api.createGroup(name));

export const useRenameGroup = () =>
  useBoardMutation(({ id, name }: { id: number; name: string }) => api.renameGroup(id, name));

export const useDeleteGroup = () => useBoardMutation((id: number) => api.deleteGroup(id));

export const useAddMember = () =>
  useBoardMutation(({ groupId, userId }: { groupId: number; userId: number }) => api.addMember(groupId, userId));

export const useRemoveMember = () =>
  useBoardMutation(({ groupId, userId }: { groupId: number; userId: number }) => api.removeMember(groupId, userId));
