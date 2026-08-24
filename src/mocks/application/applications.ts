import type {
  Applicant,
  ApplicantListParams,
  ApplicationDetail,
  ApplicationStatus,
  EvaluationPayload,
  Page,
} from "../../types/application";

/** BE 에 admin application 컨트롤러가 아직 없어 화면을 먼저 만든다. */
const NAMES = ["김지원", "이준호", "박서연", "최민수", "정예진", "강도윤", "윤채원"];
const COLLEGES = ["경영대학", "IT융합대학", "공과대학"];
const MAJORS = ["경영학과", "컴퓨터공학과", "전자공학부", "경제통상학부"];

const ALL: Applicant[] = Array.from({ length: 31 }, (_, i) => {
  const evaluated = i % 3 !== 0;
  const status: ApplicationStatus = !evaluated ? "SUBMITTED" : i % 4 === 0 ? "DOC_FAIL" : "DOC_PASS";
  return {
    id: 42 + i,
    applicantName: NAMES[i % NAMES.length],
    college: COLLEGES[i % COLLEGES.length],
    major: MAJORS[i % MAJORS.length],
    grade: (i % 4) + 1,
    // 평가 전에는 점수가 없다. 0 점과 구분된다.
    totalScore: evaluated ? 70 + ((i * 7) % 30) : null,
    evaluated,
    status,
    passed: !evaluated ? null : status === "DOC_PASS",
    submittedAt: new Date(Date.UTC(2026, 8, 1 + (i % 28), 12, 3, 44)).toISOString(),
  };
});

const delay = () => new Promise((r) => setTimeout(r, 200));

/** 목록과 순차 탐색이 같은 조건을 써야 순서가 어긋나지 않는다. */
function filterApplicants(params: ApplicantListParams): Applicant[] {
  const { status, evaluated, keyword } = params;
  const kw = keyword?.trim().toLowerCase();

  return ALL.filter((a) => {
    if (status && a.status !== status) return false;
    if (evaluated !== undefined && a.evaluated !== evaluated) return false;
    if (!kw) return true;
    return a.applicantName.toLowerCase().includes(kw);
  });
}

export async function fetchApplicants(params: ApplicantListParams): Promise<Page<Applicant>> {
  await delay();
  const { page = 0, size = 10 } = params;
  const filtered = filterApplicants(params);

  const start = page * size;
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  return {
    content: filtered.slice(start, start + size),
    page,
    size,
    totalElements: filtered.length,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}

/** 합·불 처리. 상태도 함께 바뀌어야 목록이 실제 서버처럼 반응한다. */
export async function updateStatus(id: number, passed: boolean): Promise<void> {
  await delay();
  const applicant = ALL.find((a) => a.id === id);
  if (!applicant) throw { code: "APPLICATION_NOT_FOUND", message: "지원서를 찾을 수 없습니다." };

  applicant.passed = passed;
  applicant.status = passed ? "DOC_PASS" : "DOC_FAIL";
}

const CRITERIA = [
  { criterionId: 1, name: "전공 적합성", guideline: "전공과 활동 분야가 맞는가", maxScore: 20 },
  { criterionId: 2, name: "지원 동기", guideline: "동기가 구체적인가", maxScore: 30 },
  { criterionId: 3, name: "경험 및 역량", guideline: "관련 경험이 있는가", maxScore: 30 },
  { criterionId: 4, name: "성장 가능성", guideline: "배우려는 자세가 보이는가", maxScore: 20 },
];

const QUESTIONS = [
  "지원 동기를 작성해주세요",
  "프로그래밍 경험이 있다면 설명해주세요",
  "GETIT에서 어떤 프로젝트를 하고 싶으신가요?",
];

/** 저장한 점수. 서버가 들고 있는 것을 흉내 낸다. */
const TOTAL_MAX = CRITERIA.reduce((sum, c) => sum + c.maxScore, 0);

/**
 * 목록의 `totalScore` 를 기준별 점수로 쪼갠다.
 *
 * 내림한 뒤 남은 점수를 여유가 있는 기준에 1점씩 돌려 **합계가 정확히 `totalScore`** 가 되고
 * 어느 기준도 배점을 넘지 않는다.
 */
function splitScore(totalScore: number): Map<number, number> {
  const scores = new Map(CRITERIA.map((c) => [c.criterionId, Math.floor((totalScore * c.maxScore) / TOTAL_MAX)]));
  let left = totalScore - [...scores.values()].reduce((a, b) => a + b, 0);

  for (const criterion of CRITERIA) {
    if (left === 0) break;
    const current = scores.get(criterion.criterionId) ?? 0;
    const room = Math.min(left, criterion.maxScore - current);
    scores.set(criterion.criterionId, current + room);
    left -= room;
  }

  return scores;
}

/**
 * 이미 평가된 지원자의 점수를 처음부터 채워 둔다.
 *
 * 비워 두면 목록에는 '평가 완료' 인 지원자가 상세에서는 **미평가·빈 점수로 보이고,
 * 그 상태로 저장하면 기존 평가가 지워진다.** 목록과 상세가 같은 데이터를 봐야 한다.
 */
const savedScores = new Map<number, Map<number, number>>(
  ALL.filter((a) => a.evaluated && a.totalScore !== null).map((a) => [a.id, splitScore(a.totalScore as number)]),
);

/**
 * 순차 탐색은 목록과 같은 조건에서 계산해야 순서가 맞는다.
 * 목록 필터를 그대로 받아 같은 방식으로 거른 뒤 위치를 찾는다.
 */
function navigationFor(id: number, params: ApplicantListParams) {
  const ordered = filterApplicants(params);
  const at = ordered.findIndex((a) => a.id === id);

  return {
    current: at + 1,
    total: ordered.length,
    prevId: at > 0 ? ordered[at - 1].id : null,
    nextId: at >= 0 && at < ordered.length - 1 ? ordered[at + 1].id : null,
  };
}

export async function fetchApplicationDetail(id: number, params: ApplicantListParams): Promise<ApplicationDetail> {
  await delay();

  const applicant = ALL.find((a) => a.id === id);
  if (!applicant) throw { code: "APPLICATION_NOT_FOUND", message: "지원서를 찾을 수 없습니다." };

  // 평가 여부와 총점은 목록이 쓰는 값을 그대로 쓴다. 두 화면이 갈리면 안 된다.
  const scores = savedScores.get(id);

  return {
    id: applicant.id,
    applicantName: applicant.applicantName,
    email: `applicant${id}@example.com`,
    phoneNumber: "010-1234-5678",
    college: applicant.college,
    major: applicant.major,
    grade: applicant.grade,
    status: applicant.status,
    submittedAt: applicant.submittedAt,
    answers: QUESTIONS.map((question, i) => ({
      questionId: i + 1,
      order: i + 1,
      question,
      type: "TEXT",
      // 마지막 문항은 비워 둔 지원자가 있다. 화면이 그 경우를 견뎌야 한다.
      answerText: i === 2 && id % 2 === 0 ? null : `${applicant.applicantName}의 ${i + 1}번 답변입니다.`,
      selectedOptions: null,
    })),
    evaluation: {
      evaluated: applicant.evaluated,
      totalScore: applicant.totalScore,
      scores: CRITERIA.map((c) => ({ ...c, score: scores?.get(c.criterionId) ?? null })),
    },
    navigation: navigationFor(id, params),
  };
}

export async function saveEvaluation(id: number, payload: EvaluationPayload): Promise<void> {
  await delay();

  for (const { criterionId, score } of payload.scores) {
    const criterion = CRITERIA.find((c) => c.criterionId === criterionId);
    // 서버가 막는 것을 목도 막는다. 화면 검증이 빠지면 여기서 걸린다.
    if (!criterion || score < 0 || score > criterion.maxScore) {
      throw { code: "SCORE_OUT_OF_RANGE", message: "점수가 배점 범위를 벗어났습니다." };
    }
  }

  savedScores.set(id, new Map(payload.scores.map((s) => [s.criterionId, s.score])));

  const applicant = ALL.find((a) => a.id === id);
  if (applicant) {
    applicant.evaluated = true;
    applicant.totalScore = payload.scores.reduce((sum, s) => sum + s.score, 0);
  }
}
