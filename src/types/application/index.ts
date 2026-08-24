import type { Page } from "../qna";

/**
 * 지원자 관리 타입. API 명세서 7.1 · 7.4 · 7.6.
 *
 * BE 에 admin application 컨트롤러가 아직 없다. 스키마가 생기면 `generated.ts` 에서 가져온다.
 */
export type { Page };

/**
 * 지원서 상태.
 *
 * TODO: 명세서 예시에서 `SUBMITTED` · `DOC_PASS` 만 확인했다. `DRAFT` 는 목록에서
 * 제외된다(5.1 의 `totalApplicants` 산출 기준). 나머지 값은 BE 와 맞춰야 한다.
 */
export const APPLICATION_STATUSES = ["SUBMITTED", "DOC_PASS", "DOC_FAIL"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** 7.1 목록 행. */
export interface Applicant {
  id: number;
  applicantName: string;
  college: string;
  major: string;
  grade: number;
  /** **평가 전이면 `null`.** 0 점과 구분해야 한다. */
  totalScore: number | null;
  evaluated: boolean;
  status: ApplicationStatus;
  /** 합·불이 정해지기 전이면 `null`. */
  passed: boolean | null;
  submittedAt: string;
}

export interface ApplicantListParams {
  status?: ApplicationStatus;
  /** 평가 완료 여부. 지정하지 않으면 전체. */
  evaluated?: boolean;
  /** 이름 · 이메일 검색. */
  keyword?: string;
  page?: number;
  size?: number;
}

/** 지원서 문항과 답변. (7.2) */
export interface ApplicationAnswer {
  questionId: number;
  order: number;
  question: string;
  type: string;
  /** **비워 둔 문항은 `null`.** 화면에 "답변 없음" 을 보여준다. */
  answerText: string | null;
  selectedOptions: string[] | null;
}

/** 평가 기준 한 줄. `score` 는 아직 매기지 않았으면 `null`. */
export interface EvaluationScore {
  criterionId: number;
  name: string;
  guideline: string;
  maxScore: number;
  score: number | null;
}

export interface Evaluation {
  evaluated: boolean;
  totalScore: number | null;
  scores: EvaluationScore[];
}

/**
 * 순차 탐색 위치. **응답에 함께 온다.**
 * `1 / 2` 표시와 이전·다음 버튼을 이 하나로 처리한다.
 */
export interface ApplicationNavigation {
  current: number;
  total: number;
  prevId: number | null;
  nextId: number | null;
}

/** 지원서 상세 (7.2). */
export interface ApplicationDetail {
  id: number;
  applicantName: string;
  email: string;
  phoneNumber: string;
  college: string;
  major: string;
  grade: number;
  status: ApplicationStatus;
  submittedAt: string;
  answers: ApplicationAnswer[];
  evaluation: Evaluation;
  navigation: ApplicationNavigation;
}

/** 평가 저장 (7.3). */
export interface EvaluationPayload {
  scores: { criterionId: number; score: number }[];
}
