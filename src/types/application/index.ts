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
