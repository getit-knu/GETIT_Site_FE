import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getQuestion, getQuestions, saveAnswer } from "../../apis/qna/questionsApi";
import { queryKeys } from "../../apis/queryKeys";
import type { QuestionListParams } from "../../types/qna";

export function useQuestions(params: QuestionListParams) {
  return useQuery({
    queryKey: queryKeys.questions.list(params),
    queryFn: () => getQuestions(params),

    // 페이지를 넘길 때 표가 빈 화면으로 깜빡이지 않게 이전 페이지를 그대로 둔다.
    placeholderData: (previous) => previous,
  });
}

export function useQuestion(id: number | null) {
  return useQuery({
    queryKey: queryKeys.questions.detail(id ?? 0),
    queryFn: () => getQuestion(id!),
    // 모달이 닫혀 있으면 id 가 없다. 그때는 요청하지 않는다.
    enabled: id !== null,
  });
}

export function useSaveAnswer(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, isEdit }: { content: string; isEdit: boolean }) => saveAnswer(id, content, isEdit),

    onSuccess: async () => {
      // 답변을 쓰면 상태가 ANSWERED 로 바뀐다. 상세만 갱신하면 목록의 배지가 그대로 남는다.
      // 도메인 루트를 무효화해 목록·상세를 함께 다시 받는다.
      await queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
    },
  });
}
