import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getForm, getMyApplication, getResult, saveDraft, submit } from "../../apis/application/myApplicationApi";
import { queryKeys } from "../../apis/queryKeys";
import type { ApplicationDraftPayload } from "../../types/application";

export function useApplicationForm() {
  return useQuery({ queryKey: queryKeys.myApplication.form(), queryFn: getForm });
}

/** 내 지원서. 아직 없으면(지원 전) `data`가 `null`이다 — 에러가 아니다. */
export function useMyApplication() {
  return useQuery({ queryKey: queryKeys.myApplication.mine(), queryFn: getMyApplication });
}

export function useApplicationResult() {
  return useQuery({ queryKey: queryKeys.myApplication.result(), queryFn: getResult });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApplicationDraftPayload) => saveDraft(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.myApplication.mine() });
    },
  });
}

/**
 * 제출. 성공하면 상태가 `DRAFT`에서 벗어나 화면이 결과 보기로 바뀌어야 하므로
 * `useMyApplication`을 다시 불러온다. 결과 조회 캐시도 함께 무효화해 최신 상태를 본다.
 */
export function useSubmitApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApplicationDraftPayload) => submit(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.myApplication.mine() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.myApplication.result() });
    },
  });
}
