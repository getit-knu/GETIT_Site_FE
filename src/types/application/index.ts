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

/**
 * 7.1 목록 행. `college`는 지원자가 고르지 않았거나 마스터 데이터에서 못 찾으면 `null`
 * (BE 확인함). `studentNumber`는 제출 시 필수 검증 대상이 아니라(#189 확인) `null`일 수
 * 있다. `grade`는 기본 정보 필수 검증 대상이라 제출된 지원서엔 항상 있다.
 *
 * `totalScore`·`evaluatorCount`는 **아직 서버가 주지 않는다**(`getit-knu/GETIT_Site_BE#188` —
 * `ApplicantSummary`에 점수 필드 자체가 없다). 값이 실려 오기 시작하면 화면이 그대로
 * 그린다. 아무도 평가하지 않은 지원자는 그 뒤에도 `null`이다.
 */
export interface Applicant {
  id: number;
  name: string;
  studentNumber: string | null;
  college: string | null;
  grade: number;
  status: ApplicationStatus;
  submittedAt: string;
  /** 모든 기준을 매긴 평가자들의 총점 평균(7.3 `EvaluationSummary.totalScore`와 같은 계산). */
  totalScore?: number | null;
  /** 평가를 끝낸 운영진 수. 한 명만 매긴 점수와 여럿이 매긴 점수를 같이 볼 수 없다. */
  evaluatorCount?: number | null;
}

/**
 * 지원자 전체 기준 점수 요약.
 *
 * **이 값은 FE가 계산할 수 없다.** 목록이 페이징돼 있어 현재 페이지로만 평균을 내면
 * 페이지를 넘길 때마다 기준값이 달라진다. 서버가 주지 않으면 아무것도 보여주지 않는다 —
 * 틀린 기준을 보여주느니 없는 편이 낫다.
 */
export interface ApplicantScoreSummary {
  /** 평가 완료자가 없으면 `null`. */
  averageTotalScore: number | null;
  evaluatedCount: number;
}

/** 7.1 응답. `summary`는 BE#188 전까지 오지 않는다. */
export type ApplicantBoard = Page<Applicant> & { summary?: ApplicantScoreSummary };

/**
 * 7.1 조회 조건. **`evaluated`·`keyword`는 실제 API에 없다**(BE `getApplicants(generationId, status, pageable)`
 * 확인함) — 이름 검색·평가 여부 필터는 지원하지 않는다.
 */
export interface ApplicantListParams {
  generationId?: number;
  status?: ApplicationStatus;
  page?: number;
  size?: number;
}

/**
 * 지원서 문항과 답변. (7.2)
 *
 * **실제 BE 응답(`ApplicationAnswerResult`)엔 `questionId`·`answerText`·`selectedOptions`만
 * 온다.** 문항 텍스트·타입·옵션 라벨은 `GET /admin/recruitment/questions`를 따로 불러
 * `questionId`로 조인한 값이다(API 함수 레이어에서 합쳐서 내려준다).
 */
export interface ApplicationAnswer {
  questionId: number;
  order: number;
  question: string;
  type: string;
  /** **비워 둔 문항은 `null`.** 화면에 "답변 없음" 을 보여준다. */
  answerText: string | null;
  selectedOptions: string[] | null;
  /** `CHOICE`/`CHECKBOX` 문항의 선택지 라벨. `selectedOptions`는 id만 담고 있어 조인해야 한다. */
  options: QuestionOption[] | null;
}

/** 평가 기준 하나에 대한, 평가자 한 명의 점수. */
export interface EvaluatorScore {
  evaluatorId: number;
  evaluatorName: string;
  score: number;
}

/**
 * 평가 기준 한 줄의 종합 결과. **여러 운영진이 각자 채점한다**(BE #151 확인함 —
 * `EvaluationScore`가 `(applicationId, criterionId, evaluatorId)` 단위로 따로 저장됨).
 */
export interface CriterionScore {
  criterionId: number;
  criterionName: string;
  maxScore: number;
  /** 아무도 이 기준을 채점하지 않았으면 `null`. */
  averageScore: number | null;
  /** 로그인한 본인이 아직 이 기준을 안 매겼으면 `null`. */
  myScore: number | null;
  evaluatorScores: EvaluatorScore[];
}

/**
 * `GET/PUT /api/admin/recruitment/applications/{id}/scores` 응답 (7.3).
 *
 * `totalScore`는 **모든 기준을 다 매긴 평가자들의 총점 평균**이다 — 일부만 매긴 평가자는
 * 포함하지 않는다(BE 확인함). 완주한 평가자가 없으면 `null`.
 */
export interface EvaluationSummary {
  applicationId: number;
  criteria: CriterionScore[];
  totalScore: number | null;
  evaluatorCount: number;
  /** 본인이 아직 다 안 매겼으면 `null`. */
  myTotalScore: number | null;
}

/** 평가 저장 요청 (7.3). 로그인한 운영진 본인의 점수로 저장된다 — `evaluatorId`는 안 보낸다. */
export interface EvaluationPayload {
  scores: { criterionId: number; score: number }[];
}

/** 지원서 상세 (7.2). 평가 점수·순차 탐색은 각자 별도 엔드포인트라 여기 없다. */
export interface ApplicationDetail {
  id: number;
  status: ApplicationStatus;
  basicInfo: BasicInfo;
  answers: ApplicationAnswer[];
  submittedAt: string;
}

/** 순차 탐색 (7.5). **개수·현재 위치는 안 온다** — 이전·다음 id만 있다(BE 확인함). */
export interface AdjacentApplicants {
  previousId: number | null;
  nextId: number | null;
}

/** 서류/최종 합불 일괄 처리 요청 (7.4 확장). */
export interface BulkDecisionPayload {
  applicationIds: number[];
  status: ApplicationStatus;
}

export interface BulkDecisionResult {
  updatedCount: number;
  status: ApplicationStatus;
}

/** 서류/최종 합불 단건 처리 결과 (7.4). */
export interface DocumentDecisionResult {
  applicationId: number;
  status: ApplicationStatus;
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
