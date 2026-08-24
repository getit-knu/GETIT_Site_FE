import type {
  CriteriaBoard,
  Criterion,
  CriterionDraft,
  QuestionPayload,
  RecruitmentQuestion,
  RecruitmentSchedule,
  SchedulePayload,
} from "../../types/recruitment";

/** BE 에 admin recruitment 컨트롤러가 아직 없어 화면을 먼저 만든다. */
const delay = () => new Promise((r) => setTimeout(r, 200));

let schedule: RecruitmentSchedule = {
  generationId: 9,
  generationNo: 9,
  year: 2026,
  totalStartAt: "2026-09-01T00:00",
  totalEndAt: "2026-09-30T23:59",
  documentStartAt: "2026-09-01T00:00",
  documentEndAt: "2026-09-10T23:59",
  interviewStartAt: "2026-09-15T00:00",
  interviewEndAt: "2026-09-30T23:59",
};

export async function fetchSchedule(): Promise<RecruitmentSchedule> {
  await delay();
  return { ...schedule };
}

export async function saveSchedule(payload: SchedulePayload): Promise<RecruitmentSchedule> {
  await delay();
  // 서버가 막는 것을 목도 막는다. 화면 검증이 빠지면 여기서 걸린다.
  if (payload.totalStartAt >= payload.totalEndAt) {
    throw { code: "VALIDATION_FAILED", message: "전체 시작이 종료보다 늦습니다." };
  }
  if (payload.documentStartAt >= payload.documentEndAt || payload.documentEndAt > payload.totalEndAt) {
    throw { code: "VALIDATION_FAILED", message: "서류 기간이 전체 기간을 벗어납니다." };
  }
  if (payload.documentEndAt > payload.interviewStartAt) {
    throw { code: "VALIDATION_FAILED", message: "면접은 서류 마감 뒤에 시작해야 합니다." };
  }

  // interviewEndAt 은 요청에 없다. 서버가 totalEndAt 으로 맞춘다.
  schedule = { ...schedule, ...payload, interviewEndAt: payload.totalEndAt };
  return { ...schedule };
}

let questions: RecruitmentQuestion[] = [
  { id: 1, order: 1, type: "TEXT", content: "지원 동기를 작성해주세요", required: true, maxLength: 300, options: null },
  {
    id: 2,
    order: 2,
    type: "TEXT",
    content: "프로그래밍 경험이 있다면 설명해주세요",
    required: false,
    maxLength: 300,
    options: null,
  },
  {
    id: 3,
    order: 3,
    type: "CHOICE",
    content: "희망 트랙을 선택해주세요",
    required: true,
    maxLength: null,
    options: [
      { id: "sw", label: "SW 개발" },
      { id: "startup", label: "창업" },
    ],
  },
];
let nextQuestionId = 4;

const reorder = () => questions.forEach((q, i) => (q.order = i + 1));

export async function fetchQuestions(): Promise<RecruitmentQuestion[]> {
  await delay();
  return structuredClone(questions);
}

export async function createQuestion(payload: QuestionPayload): Promise<void> {
  await delay();
  questions.push({ ...payload, id: nextQuestionId++, order: questions.length + 1 });
}

export async function updateQuestion(id: number, payload: QuestionPayload): Promise<void> {
  await delay();
  const at = questions.findIndex((q) => q.id === id);
  if (at >= 0) questions[at] = { ...questions[at], ...payload };
}

export async function deleteQuestion(id: number): Promise<void> {
  await delay();
  questions = questions.filter((q) => q.id !== id);
  reorder();
}

/** 배열 순서대로 order 를 1부터 다시 매긴다. */
export async function reorderQuestions(orderedIds: number[]): Promise<void> {
  await delay();
  questions = orderedIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is RecruitmentQuestion => q !== undefined);
  reorder();
}

let criteria: Criterion[] = [
  { id: 1, order: 1, name: "전공 적합성", guideline: "전공과 활동 분야가 맞는가", maxScore: 20 },
  { id: 2, order: 2, name: "지원 동기", guideline: "동기가 구체적인가", maxScore: 30 },
  { id: 3, order: 3, name: "경험 및 역량", guideline: "관련 경험이 있는가", maxScore: 30 },
  { id: 4, order: 4, name: "성장 가능성", guideline: "배우려는 자세가 보이는가", maxScore: 20 },
];
let nextCriterionId = 5;

function board(): CriteriaBoard {
  const totalScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);
  return { criteria: structuredClone(criteria), totalScore, valid: totalScore === 100 };
}

export async function fetchCriteria(): Promise<CriteriaBoard> {
  await delay();
  return board();
}

/**
 * 평가 기준 일괄 저장.
 *
 * **명세서(6.9 ~ 6.11)는 추가·수정·삭제를 따로 두고 매 쓰기마다 합계 100 을 강제한다.**
 * 그러면 기준을 하나 늘리려고 다른 기준을 줄이는 순간 합계가 90 이 되어 막히고,
 * 먼저 늘려도 110 이 되어 막힌다 — 어느 순서로도 편집할 수 없다.
 *
 * 명세서 본문도 이를 지적하며 일괄 저장을 권장한다. 그 형태로 만들었다.
 * BE 에 `PUT /admin/recruitment/criteria` 가 필요하다.
 */
export async function saveCriteria(drafts: CriterionDraft[]): Promise<void> {
  await delay();

  const total = drafts.reduce((sum, d) => sum + d.maxScore, 0);
  if (total !== 100) {
    throw {
      code: "INVALID_CRITERIA_TOTAL",
      message: `평가 기준 배점 합계는 100점이어야 합니다. (현재 ${total}점)`,
    };
  }

  criteria = drafts.map((d, i) => ({
    id: d.id ?? nextCriterionId++,
    order: i + 1,
    name: d.name,
    guideline: d.guideline,
    maxScore: d.maxScore,
  }));
}
