import { useQuery } from "@tanstack/react-query";

import { getMyQuestions } from "../../apis/qna/myQuestionsApi";
import { queryKeys } from "../../apis/queryKeys";

export function useMyQuestions(page = 0, size = 5) {
  return useQuery({
    queryKey: queryKeys.member.myQuestions(page),
    queryFn: () => getMyQuestions({ page, size }),
  });
}
