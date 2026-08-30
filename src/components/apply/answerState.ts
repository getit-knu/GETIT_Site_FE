import type { ApplicationFormQuestion } from "../../types/application";

/**
 * 문항 하나의 답변 초안. BE 제출 계약(`ApplicationAnswer`)과 같은 모양으로 둔다 —
 * 나중에 저장/제출(#189)에서 그대로 실어 보낼 수 있게.
 */
export interface AnswerState {
  answerText: string | null;
  selectedOptions: string[] | null;
}

/** 문항 타입에 맞는 빈 답변. */
export function emptyAnswer(question: ApplicationFormQuestion): AnswerState {
  return question.type === "TEXT"
    ? { answerText: "", selectedOptions: null }
    : { answerText: null, selectedOptions: [] };
}
