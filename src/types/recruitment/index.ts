import type { components } from "../../apis/generated";

/**
 * 지원 시스템 설정 타입. API 명세서 6.1 ~ 6.11.
 *
 * `apis/generated.ts`(BE OpenAPI 스펙)에서 재노출한다.
 */

/** 6.1 모집 일정. `interviewEndAt` 은 서버가 `totalEndAt` 으로 맞춘다. */
export type RecruitmentSchedule = Required<components["schemas"]["RecruitmentScheduleResult"]>;

/** 6.2 저장 요청. `interviewEndAt` 은 보내지 않는다(요청 스키마 자체에 필드가 없다). */
export type SchedulePayload = components["schemas"]["RecruitmentScheduleUpdateRequest"];

export type QuestionType = components["schemas"]["ApplicationQuestionRequest"]["type"];

export type QuestionOption = Required<components["schemas"]["QuestionOption"]>;

/**
 * 6.3 지원서 문항.
 *
 * `maxLength`/`options`는 생성된 스키마엔 optional로만 잡혀 있다 — 실제로는 문항 타입에
 * 따라 아예 없는 값(TEXT엔 `options` 없음, CHOICE/CHECKBOX엔 `maxLength` 없음)이라
 * `undefined` 대신 명시적으로 `null`로 되돌린다(기존 화면·mock과 값 형태를 맞춘다).
 */
export interface RecruitmentQuestion {
  id: number;
  order: number;
  type: QuestionType;
  content: string;
  required: boolean;
  /** `TEXT` 만 쓴다. */
  maxLength: number | null;
  /** `CHOICE`, `CHECKBOX` 만 쓴다. `CHECKBOX` 는 항상 1개다. */
  options: QuestionOption[] | null;
}

/**
 * 6.4 · 6.5 요청 본문. 생성된 요청 스키마는 `maxLength`/`options`가 `undefined`만
 * 허용하는데, 화면은 "이 문항 타입엔 없음"을 `null`로 명시해서 보낸다(위 `RecruitmentQuestion`과
 * 형태를 맞춤) — BE `Integer`/`List` 필드는 nullable이라 `null`도 그대로 받아들인다.
 */
export interface QuestionPayload {
  type: QuestionType;
  content: string;
  required: boolean;
  maxLength: number | null;
  options: QuestionOption[] | null;
}

/** 6.7 순서 변경 요청 본문. */
export type QuestionOrderPayload = Required<components["schemas"]["QuestionOrderRequest"]>;

/** 6.8 평가 기준. */
export type Criterion = Required<components["schemas"]["EvaluationCriterionResult"]>;

/** 6.9 · 6.10 요청 본문. */
export type CriterionPayload = components["schemas"]["EvaluationCriterionRequest"];

/**
 * `valid` 는 `totalScore === 100` 여부. 화면의 "총점: 100점" 표시에 쓴다.
 *
 * `criteria`는 생성된 스키마의 얕은 `Required<>`로는 원소 타입까지 안 잡혀서
 * (`EvaluationCriteriaSummary`를 통째로 `Required`해도 `criteria[]`의 각 원소는 여전히
 * 전부 optional로 남는다) 이미 다잡은 `Criterion[]`로 직접 구성한다.
 */
export interface CriteriaBoard {
  criteria: Criterion[];
  totalScore: number;
  valid: boolean;
}

/**
 * 화면이 "저장" 한 번에 여러 줄을 편집하는 초안. BE 계약이 아니라 FE 전용 형태다
 * (실제로는 항목별 CRUD로 나눠 보낸다 — `recruitmentApi.saveCriteria` 참고).
 * 새로 만든 것은 `id` 가 없다.
 */
export interface CriterionDraft {
  id?: number;
  name: string;
  guideline: string;
  maxScore: number;
}

export type RecruitmentPhase = NonNullable<components["schemas"]["RecruitmentStatusResult"]["phase"]>;

export type ScheduleWindow = Required<components["schemas"]["RecruitmentStatusResultScheduleWindow"]>;

/**
 * `GET /api/public/recruitment/status` 응답. `dDay`·`applyEnabled`는 BE가 계산해서 준다.
 *
 * `applyEnabled`가 `false`(예정된 모집이 없음)면 `generationNo`/`year`/`dDay`/`schedule`은
 * `null`로 온다(실제로 확인함) — 생성된 스키마엔 `| null`이 안 잡혀 있어 손으로 되돌린다.
 */
export interface RecruitmentStatus {
  generationNo: number | null;
  year: number | null;
  phase: RecruitmentPhase;
  dDay: number | null;
  message: string;
  applyEnabled: boolean;
  schedule: ScheduleWindow | null;
}
