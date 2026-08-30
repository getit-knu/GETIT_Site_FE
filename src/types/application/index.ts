import type { components } from "../../apis/generated";
import type { QuestionOption, QuestionType } from "../recruitment";
import type { Page } from "../qna";

/**
 * 지원자 관리 타입. API 명세서 7.1 · 7.4 · 7.6.
 *
 * BE 에 admin application 컨트롤러가 아직 없다. 스키마가 생기면 `generated.ts` 에서 가져온다.
 *
 * **지원서 양식 조회(3.1, `ApplicationFormResult` 이하)는 다르다** — 이미 스키마가 있어
 * `generated.ts` 에서 재노출한다(#188).
 */
export type { Page };

/**
 * 지원서 상태.
 *
 * BE `ApplicationStatus` enum 전체(#189 작업 중 소스로 확인함 — 예전 TODO였던
 * "나머지 값은 BE 와 맞춰야 한다" 해소). **`DRAFT` 는 어드민 목록에서 제외된다**
 * (5.1 의 `totalApplicants` 산출 기준) — 그래서 `Applicant.status` 로는 안 오지만,
 * 타입 자체는 지원자 본인 쪽(`MyApplicationResult.status` 등)에서 필요해 넣어 둔다.
 */
export const APPLICATION_STATUSES = ["DRAFT", "SUBMITTED", "DOC_PASS", "DOC_FAIL", "FINAL_PASS", "FINAL_FAIL"] as const;

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
  /**
   * `CHOICE`/`CHECKBOX` 문항의 선택지 라벨. `selectedOptions` 는 id 만 담고 있어
   * 화면에 보여줄 텍스트를 알 수 없다 — 지금은 목에서 같이 내려준다.
   *
   * **실제 BE 응답(`ApplicationAnswerResult`)엔 이 필드가 없다.** `questionId`·`answerText`·
   * `selectedOptions` 만 오고, 문항 텍스트·타입·옵션 라벨은 `GET /admin/recruitment/questions`
   * 를 따로 불러 조인해야 한다 — 연동 시점(#107)에 이 타입 자체를 다시 손봐야 한다.
   */
  options: QuestionOption[] | null;
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

/**
 * 3.1 지원서 문항. 어드민 `RecruitmentQuestion`과 필드가 거의 같지만 `placeholder`가
 * 더 있다. `maxLength`는 `TEXT`만, `options`는 `CHOICE`/`CHECKBOX`만 쓴다
 * (`CHECKBOX`는 항상 옵션 1개짜리 동의 문항 — `QuestionRow.tsx`에서 확인한 것과 같은 규약).
 */
export interface ApplicationFormQuestion {
  id: number;
  order: number;
  type: QuestionType;
  content: string;
  /** `TEXT`만 쓴다. */
  placeholder: string | null;
  required: boolean;
  /** `TEXT`만 쓴다. */
  maxLength: number | null;
  /** `CHOICE`, `CHECKBOX`만 쓴다. */
  options: QuestionOption[] | null;
}

/**
 * 지원서 기본 정보 프리필.
 *
 * `name`·`email`은 구글 로그인 시 항상 채워지지만, 나머지는 아직 프로필을 다 안 채운
 * 신규 지원자면 없을 수 있다고 보고 `Me`(로그인 세션)의 nullable 패턴을 그대로 따랐다 —
 * springdoc이 null 가능성을 반영 안 해서(생성된 스키마는 전부 optional) 실제 응답으로
 * 확인 전까지는 추정이다.
 */
export interface BasicInfo {
  name: string;
  email: string;
  phoneNumber: string | null;
  collegeId: number | null;
  majorId: number | null;
  grade: number | null;
  studentNumber: string | null;
}

export type ApplicationPhase = NonNullable<components["schemas"]["ApplicationFormResult"]["phase"]>;

/** `GET /api/applications/form` 응답 (3.1). */
export interface ApplicationFormResult {
  generationNo: number;
  phase: ApplicationPhase;
  deadline: string;
  basicInfoPrefill: BasicInfo;
  questions: ApplicationFormQuestion[];
}

/**
 * 내 지원서 문항 답변. **어드민용 `ApplicationAnswer`(7.2)와 다르다** — 문항 텍스트·타입·
 * 옵션 라벨까지 조인해서 오는 어드민 응답과 달리, 이건 BE가 그대로 주는 얕은 모양이다
 * (`questionId`로 `ApplicationFormResult.questions`와 직접 맞춰 봐야 한다).
 */
export interface MyApplicationAnswer {
  questionId: number;
  answerText: string | null;
  selectedOptions: string[] | null;
}

/**
 * `GET /api/applications/me` 응답 (3.2). **지원서가 아직 없으면 `null`이다** — BE가 이걸
 * 에러가 아니라 정상 상태로 설계했다(활성 기수가 없어도 마찬가지로 `null`).
 */
export interface MyApplicationResult {
  id: number;
  generationNo: number;
  status: ApplicationStatus;
  basicInfo: BasicInfo;
  answers: MyApplicationAnswer[];
  /** 마지막으로 저장(임시저장 포함)된 시각. */
  savedAt: string;
  /** `DRAFT`면 아직 제출 전이라 `null`. */
  submittedAt: string | null;
}

/** `PUT /api/applications/me/draft` · `POST /api/applications/me/submit` 요청 본문 (3.3 · 3.4 공용). */
export interface ApplicationDraftPayload {
  basicInfo: BasicInfo;
  answers: MyApplicationAnswer[];
}

export type DraftSaveResult = Required<components["schemas"]["DraftSaveResult"]>;
export type SubmitResult = Required<components["schemas"]["SubmitResult"]>;

/** 합격 이후 다음 단계 안내. `DOC_PASS`일 때만 채워진다(그 외 상태는 `ApplicationDecisionResult.nextStep`이 `null`). */
export type NextStep = Required<components["schemas"]["NextStep"]>;

/** `GET /api/applications/me/result` 응답 (3.5). 제출한 지원서가 없으면 404(`RESOURCE_NOT_FOUND`)다. */
export interface ApplicationDecisionResult {
  generationNo: number;
  status: ApplicationStatus;
  statusLabel: string;
  documentAnnouncedAt: string;
  finalAnnouncedAt: string;
  nextStep: NextStep | null;
}
