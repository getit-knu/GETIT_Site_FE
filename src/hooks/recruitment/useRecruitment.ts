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

export const useSaveCriteria = () =>
  useInvalidating((drafts: CriterionDraft[]) => api.saveCriteria(drafts), keys.criteria());
