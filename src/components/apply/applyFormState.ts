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
 * 아직 못 채운 자리를 가리키는 이름. 화면에서 그 입력칸의 `id`를 만드는 데 그대로 쓴다 —
 * 이유만 알려주고 어디를 고쳐야 하는지는 안 알려주면, 긴 폼에서는 직접 찾아 올라가야 한다.
 */
export type BlockedFieldKey = "name" | "email" | "phone" | "college" | "major" | "grade" | `question-${number}`;

export interface SubmitBlocker {
  /** 데려다 놓아야 할 입력칸. */
  field: BlockedFieldKey;
  message: string;
}

/** 기본 정보에서 비어 있는 첫 칸. 검사 순서는 화면에 놓인 순서와 같다. */
const BASIC_INFO_CHECKS: Array<{ field: BlockedFieldKey; message: string; isEmpty: (s: BasicInfoState) => boolean }> = [
  { field: "name", message: "이름을 입력해 주세요.", isEmpty: (s) => s.name.trim() === "" },
  { field: "email", message: "이메일을 입력해 주세요.", isEmpty: (s) => s.email.trim() === "" },
  { field: "phone", message: "전화번호를 입력해 주세요.", isEmpty: (s) => s.phone.trim() === "" },
  { field: "college", message: "단과 대학을 선택해 주세요.", isEmpty: (s) => s.collegeId === 0 },
  { field: "major", message: "전공을 선택해 주세요.", isEmpty: (s) => s.majorId === 0 },
  { field: "grade", message: "학년을 입력해 주세요.", isEmpty: (s) => s.grade.trim() === "" },
];

/**
 * 제출을 막는 첫 자리. BE `ApplicationSubmissionValidator`(3.4 4 ~ 6단계)와 같은 순서로 검사한다 —
 * 눌러 보고서야 알게 하지 않고 미리 보여준다. **`studentNumber`(학번)는 BE도 필수로 안 본다.**
 *
 * 예전엔 기본 정보를 뭉뚱그려 "이름 · 이메일 · … 을 모두 입력해 주세요"라고만 했다. 여섯 칸 중
 * 어디가 비었는지는 여전히 사용자가 찾아야 했다 — 이제 첫 번째 빈 칸 하나를 짚는다.
 */
export function submitBlocker(
  basicInfo: BasicInfoState,
  answers: Answers,
  questions: ApplicationFormQuestion[],
): SubmitBlocker | null {
  for (const check of BASIC_INFO_CHECKS) {
    if (check.isEmpty(basicInfo)) return { field: check.field, message: check.message };
  }

  for (const question of questions) {
    if (!question.required) continue;
    const answer = answers[question.id];
    const answered =
      (answer.answerText !== null && answer.answerText.trim() !== "") ||
      (answer.selectedOptions !== null && answer.selectedOptions.length > 0);
    if (!answered) return { field: `question-${question.id}`, message: `"${question.content}"에 답변해 주세요.` };
  }

  for (const question of questions) {
    const answer = answers[question.id];
    if (question.maxLength !== null && answer.answerText !== null && answer.answerText.length > question.maxLength) {
      return {
        field: `question-${question.id}`,
        message: `"${question.content}"이(가) ${question.maxLength}자를 넘었어요.`,
      };
    }
  }

  return null;
}
