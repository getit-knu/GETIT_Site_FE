import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../apis/queryKeys";
import { deleteUser, getUsers, promoteApplicants, updateUser } from "../../apis/user/usersApi";
import type { PromotionResult, UpdateUserPayload, UserListParams } from "../../types/user";

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => getUsers(params),
    // 페이지를 넘길 때 표가 빈 화면으로 깜빡이지 않게 이전 페이지를 유지한다.
    placeholderData: (previous) => previous,
  });
}

/**
 * 목록을 다시 받아야 하는 쓰기 동작들. 셋 다 목록의 값을 바꾼다.
 *
 * `groups.all`도 함께 무효화한다 — `useUpdateUser`로 사용자의 조를 바꾸면(배정·미배정
 * 전환 포함) 조 관리 탭(`GroupsTab`)이 보여주는 조원 구성도 같이 달라지는데, 두 화면이
 * 서로 다른 쿼리 키를 써서 한쪽만 무효화하면 다른 탭은 새로고침 전까지 낡은 채로 남는다.
 */
function useUserMutation<TArgs, TData = void>(fn: (args: TArgs) => Promise<TData>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.all }),
      ]);
    },
  });
}

export const useUpdateUser = () =>
  useUserMutation(({ id, payload }: { id: number; payload: UpdateUserPayload }) => updateUser(id, payload));

export const useDeleteUser = () => useUserMutation((id: number) => deleteUser(id));

/** 인자가 없다. `void` 를 명시해야 `mutate()` 를 인자 없이 부를 수 있다. */
export const usePromoteApplicants = () => useUserMutation<void, PromotionResult>(() => promoteApplicants());
