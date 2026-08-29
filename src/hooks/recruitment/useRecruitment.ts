import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../apis/queryKeys";
import * as api from "../../apis/recruitment/recruitmentApi";
import type { CriterionDraft, QuestionPayload, SchedulePayload } from "../../types/recruitment";

const keys = queryKeys.recruitment;

/** 세 영역을 따로 조회한다. 한 곳이 실패해도 나머지는 고칠 수 있어야 한다. */
export const useSchedule = () => useQuery({ queryKey: keys.schedule(), queryFn: api.getSchedule });
export const useQuestions = () => useQuery({ queryKey: keys.questions(), queryFn: api.getQuestions });
export const useCriteria = () => useQuery({ queryKey: keys.criteria(), queryFn: api.getCriteria });

function useInvalidating<TArgs>(fn: (args: TArgs) => Promise<unknown>, key: readonly unknown[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export const useSaveSchedule = () =>
  useInvalidating((payload: SchedulePayload) => api.saveSchedule(payload), keys.schedule());

export const useCreateQuestion = () =>
  useInvalidating((payload: QuestionPayload) => api.createQuestion(payload), keys.questions());

export const useUpdateQuestion = () =>
  useInvalidating(
    ({ id, payload }: { id: number; payload: QuestionPayload }) => api.updateQuestion(id, payload),
    keys.questions(),
  );

export const useDeleteQuestion = () => useInvalidating((id: number) => api.deleteQuestion(id), keys.questions());

export const useReorderQuestions = () =>
  useInvalidating((orderedIds: number[]) => api.reorderQuestions(orderedIds), keys.questions());

/**
 * `saveCriteria` 는 요청을 여러 번 나눠 보낸다(diff 기반). 중간에 하나가 실패하면
 * 서버는 이미 일부만 반영된 상태다 — 성공 때뿐 아니라 **실패 때도 다시 조회해서**
 * 화면이 실제로 무엇이 저장됐는지 보여줘야 한다. 그래야 사용자가 진짜 상태를 보고
 * 다시 편집·저장할 수 있다.
 */
export function useSaveCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (drafts: CriterionDraft[]) => api.saveCriteria(drafts),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.criteria() });
    },
  });
}
