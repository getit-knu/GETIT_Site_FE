import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  destroyFestaPhoneNumbers,
  downloadFestaInvestors,
  drawFestaWinners,
  getFestaResults,
  getFestaVoteResults,
  getFestaWinners,
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

/**
 * 추첨과 당첨자 조회(#412). 당첨자 번호는 볼 때마다 서버에 기록이 남으므로 쿼리로 두지 않는다 —
 * 페이지를 열거나 창을 다시 볼 때마다 저절로 불리면 기록이 쌓인다. 누를 때만 부른다.
 */
export function useDrawFestaWinners() {
  return useMutation({ mutationFn: drawFestaWinners });
}

export function useViewFestaWinners() {
  return useMutation({ mutationFn: getFestaWinners });
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
