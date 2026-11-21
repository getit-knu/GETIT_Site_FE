import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getFestaSchedule, updateFestaSchedule } from "../../apis/festa/festaAdminApi";
import { queryKeys } from "../../apis/queryKeys";

/** 어드민 투표 기간(#379). */
export function useFestaSchedule() {
  return useQuery({ queryKey: queryKeys.festa.schedule(), queryFn: getFestaSchedule });
}

/**
 * 저장하면 응답으로 어드민 캐시를 바로 바꾸고, 쇼케이스가 읽는 홈 응답(`festaSchedule`)도 다시 읽게 한다.
 * 같은 브라우저에서 쇼케이스를 열어 둔 채 기간을 바꿔도 바로 반영된다.
 */
export function useUpdateFestaSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFestaSchedule,
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.festa.schedule(), saved);
      void queryClient.invalidateQueries({ queryKey: queryKeys.public.home() });
    },
  });
}
