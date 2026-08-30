import type { ApplicationFormQuestion, BasicInfo, MyApplicationAnswer } from "../../types/application";

import type { AnswerState } from "./answerState";
import { emptyAnswer } from "./answerState";

export interface BasicInfoState {
  name: string;
  email: string;
  phone: string;
  /** 0 = 미선택. */
  collegeId: number;
  /** 0 = 미선택. 단과 대학이 바뀌면 같이 초기화된다. */
  majorId: number;
  grade: string;
  studentId: string;
}

export function toBasicInfoState(info: BasicInfo): BasicInfoState {
  return {
    name: info.name,
    email: info.email,
    phone: info.phoneNumber ?? "",
    collegeId: info.collegeId ?? 0,
    majorId: info.majorId ?? 0,
    grade: info.grade !== null ? String(info.grade) : "",
    studentId: info.studentNumber ?? "",
  };
}

export function toBasicInfoPayload(state: BasicInfoState): BasicInfo {
  return {
    name: state.name,
    email: state.email,
    phoneNumber: state.phone.trim() === "" ? null : state.phone,
    collegeId: state.collegeId === 0 ? null : state.collegeId,
    majorId: state.majorId === 0 ? null : state.majorId,
    grade: state.grade.trim() === "" ? null : Number(state.grade),
    studentNumber: state.studentId.trim() === "" ? null : state.studentId,
  };
}

export type Answers = Record<number, AnswerState>;

/** 이미 저장된 답변(이어쓰기)이 있으면 그 값으로, 없으면 문항 타입에 맞는 빈 값으로 채운다. */
export function initialAnswers(questions: ApplicationFormQuestion[], saved: MyApplicationAnswer[] | null): Answers {
  const byQuestionId = new Map((saved ?? []).map((answer) => [answer.questionId, answer]));

  return Object.fromEntries(
    questions.map((question) => {
      const saved = byQuestionId.get(question.id);
      const answer: AnswerState =
        saved !== undefined
          ? { answerText: saved.answerText, selectedOptions: saved.selectedOptions }
          : emptyAnswer(question);
      return [question.id, answer];
    }),
  );
}

export function toAnswerPayloads(answers: Answers): MyApplicationAnswer[] {
  return Object.entries(answers).map(([questionId, answer]) => ({
    questionId: Number(questionId),
    answerText: answer.answerText,
    selectedOptions: answer.selectedOptions,
  }));
}

/**
 * 제출을 막는 이유. BE `ApplicationSubmissionValidator`(3.4 4 ~ 6단계)와 같은 순서로 검사한다 —
 * 눌러 보고서야 알게 하지 않고 미리 보여준다. **`studentNumber`(학번)는 BE도 필수로 안 본다.**
 */
export function submitInvalidReason(
  basicInfo: BasicInfoState,
  answers: Answers,
  questions: ApplicationFormQuestion[],
): string | null {
  if (
    basicInfo.name.trim() === "" ||
    basicInfo.email.trim() === "" ||
    basicInfo.phone.trim() === "" ||
    basicInfo.collegeId === 0 ||
    basicInfo.majorId === 0 ||
    basicInfo.grade.trim() === ""
  ) {
    return "이름 · 이메일 · 전화번호 · 단과 대학 · 전공 · 학년을 모두 입력해 주세요.";
  }

  for (const question of questions) {
    if (!question.required) continue;
    const answer = answers[question.id];
    const answered =
      (answer.answerText !== null && answer.answerText.trim() !== "") ||
      (answer.selectedOptions !== null && answer.selectedOptions.length > 0);
    if (!answered) return `"${question.content}"에 답변해 주세요.`;
  }

  for (const question of questions) {
    const answer = answers[question.id];
    if (question.maxLength !== null && answer.answerText !== null && answer.answerText.length > question.maxLength) {
      return `"${question.content}"이(가) ${question.maxLength}자를 초과했습니다.`;
    }
  }

  return null;
}
