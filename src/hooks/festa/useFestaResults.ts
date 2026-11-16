import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  destroyFestaPhoneNumbers,
  downloadFestaInvestors,
  getFestaResults,
  getFestaVoteResults,
  resetFestaInvestments,
} from "../../apis/festa/festaAdminApi";
import { queryKeys } from "../../apis/queryKeys";

export function useFestaResults() {
  return useQuery({ queryKey: queryKeys.festa.results(), queryFn: getFestaResults });
}

export function useFestaVoteResults() {
  return useQuery({ queryKey: queryKeys.festa.voteResults(), queryFn: getFestaVoteResults });
}

export function useDownloadFestaInvestors() {
  return useMutation({ mutationFn: downloadFestaInvestors });
}

/** 파기·초기화 뒤에는 집계와(같은 브라우저에서 투자해 본 경우) 내 투자 현황이 모두 바뀐다. */
function useFestaAdminMutation<T>(fn: () => Promise<T>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.festa.all }),
  });
}

export const useDestroyFestaPhoneNumbers = () => useFestaAdminMutation(destroyFestaPhoneNumbers);

export const useResetFestaInvestments = () => useFestaAdminMutation(resetFestaInvestments);
