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

/**
 * 전화번호를 `010-1234-5678` 꼴로 다듬는다. 숫자만 남기고 자리 수에 맞춰 하이픈을 끼운다.
 *
 * 입력하는 동안 매 글자마다 부르므로, 다 치기 전 짧은 상태(`010`, `010-123`)도 그대로
 * 성립해야 한다. 숫자 11자리에서 끊어 그보다 길게 붙는 것을 막는다.
 *
 * 하이픈 자리에서 지우면 숫자가 그대로라 화면도 그대로다 — 하이픈은 우리가 끼운 것이지
 * 사용자가 친 글자가 아니기 때문이다. 한 번 더 지우면 앞 숫자가 지워진다.
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
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
export type BlockedFieldKey =
  "name" | "email" | "phone" | "college" | "major" | "grade" | "studentId" | `question-${number}`;

export interface SubmitBlocker {
  /** 데려다 놓아야 할 입력칸. */
  field: BlockedFieldKey;
  message: string;
}

/**
 * 문항 제목을 안내 문구에 붙일 때 쓸 형태. 끝의 마침표만 떼고 **문장에 끼워 넣지 않는다.**
 *
 * 예전엔 `"…"에 답변해 주세요.` 처럼 문항을 문장 안에 감쌌는데, 문항 문구는 어드민이
 * 자유롭게 쓰는 값이라 어떤 꼴이 올지 알 수 없다:
 *
 * - `지원 동기를 알려주세요` → `"…알려주세요"에 답변해 주세요` (같은 부탁을 두 번)
 * - `개인정보 수집에 동의합니다` → 서술문이라 홀로 두면 채우라는 뜻이 안 산다
 *
 * 그래서 호출부가 `아직 답하지 않았어요: <문항>` 처럼 콜론으로 끊어 붙인다 — 우리 문장과
 * 남의 문장이 섞이지 않으니 어떤 꼴이 와도 어색해지지 않는다.
 */
function questionLabel(content: string): string {
  return content.replace(/[.\s]+$/, "");
}

/**
 * 학년으로 받아들일 범위. 학부 4년제에 초과학기·편입을 감안해 넉넉히 잡는다 — 여기서 막고
 * 싶은 것은 `0`이나 `99` 같은 오타지, 실제로 있을 법한 값이 아니다.
 */
const MIN_GRADE = 1;
const MAX_GRADE = 6;

/** 경북대 학번은 10자리 숫자다(`2021123456`). 입력칸에서도 `maxLength={10}`으로 막는다. */
const STUDENT_ID_LENGTH = 10;

/**
 * 이메일 형식. `@` 앞뒤가 비지 않고 도메인에 점이 하나는 있는 정도만 본다.
 *
 * 완벽한 이메일 정규식은 존재하지 않고, 있더라도 여기서 할 일이 아니다 — **진짜 확인은
 * 그 주소로 메일이 가는지**뿐이다. 여기서는 `hong@getit` 처럼 눈에 띄는 오타를 눌러 보기
 * 전에 잡아 주는 선까지만 한다.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 기본 정보에서 잘못된 첫 칸. 검사 순서는 화면에 놓인 순서와 같다.
 *
 * 빈 칸만 보는 게 아니라 형식도 본다. 이메일 오타·학년 `0`·학번 자릿수 부족은 BE가 받아
 * 주더라도 나중에 연락이 닿지 않아 지원자만 손해다 — 제출 전에 잡는다.
 */
const BASIC_INFO_CHECKS: Array<{ field: BlockedFieldKey; message: string; isWrong: (s: BasicInfoState) => boolean }> = [
  { field: "name", message: "이름을 입력해 주세요.", isWrong: (s) => s.name.trim() === "" },

  { field: "email", message: "이메일을 입력해 주세요.", isWrong: (s) => s.email.trim() === "" },
  {
    field: "email",
    message: "이메일 형식이 올바르지 않아요. 예: hong@knu.ac.kr",
    isWrong: (s) => !EMAIL_PATTERN.test(s.email.trim()),
  },

  { field: "phone", message: "전화번호를 입력해 주세요.", isWrong: (s) => s.phone.trim() === "" },
  {
    field: "phone",
    message: "전화번호를 11자리로 입력해 주세요. 예: 010-1234-5678",
    isWrong: (s) => s.phone.replace(/\D/g, "").length !== 11,
  },

  { field: "college", message: "단과 대학을 선택해 주세요.", isWrong: (s) => s.collegeId === 0 },
  { field: "major", message: "전공을 선택해 주세요.", isWrong: (s) => s.majorId === 0 },

  { field: "grade", message: "학년을 입력해 주세요.", isWrong: (s) => s.grade.trim() === "" },
  {
    field: "grade",
    message: `학년은 ${MIN_GRADE}에서 ${MAX_GRADE} 사이로 입력해 주세요.`,
    isWrong: (s) => {
      const grade = Number(s.grade);
      return !Number.isInteger(grade) || grade < MIN_GRADE || grade > MAX_GRADE;
    },
  },

  // 학번은 BE도 필수로 안 보므로 비워 두는 것은 허용한다 — 다만 적었다면 자릿수는 맞아야 한다.
  {
    field: "studentId",
    message: `학번은 숫자 ${STUDENT_ID_LENGTH}자리예요. 예: 2021123456`,
    isWrong: (s) => s.studentId.trim() !== "" && !new RegExp(`^\\d{${STUDENT_ID_LENGTH}}$`).test(s.studentId.trim()),
  },
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
    if (check.isWrong(basicInfo)) return { field: check.field, message: check.message };
  }

  for (const question of questions) {
    if (!question.required) continue;
    const answer = answers[question.id];
    const answered =
      (answer.answerText !== null && answer.answerText.trim() !== "") ||
      (answer.selectedOptions !== null && answer.selectedOptions.length > 0);
    if (!answered)
      return { field: `question-${question.id}`, message: `아직 답하지 않았어요: ${questionLabel(question.content)}` };
  }

  for (const question of questions) {
    const answer = answers[question.id];
    if (question.maxLength !== null && answer.answerText !== null && answer.answerText.length > question.maxLength) {
      return {
        field: `question-${question.id}`,
        message: `${question.maxLength}자를 넘었어요: ${questionLabel(question.content)}`,
      };
    }
  }

  return null;
}
