import type { Applicant, ApplicantListParams, ApplicationStatus, Page } from "../../types/application";

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

export async function fetchApplicants(params: ApplicantListParams): Promise<Page<Applicant>> {
  await delay();
  const { status, evaluated, keyword, page = 0, size = 10 } = params;
  const kw = keyword?.trim().toLowerCase();

  const filtered = ALL.filter((a) => {
    if (status && a.status !== status) return false;
    if (evaluated !== undefined && a.evaluated !== evaluated) return false;
    if (!kw) return true;
    return a.applicantName.toLowerCase().includes(kw);
  });

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
