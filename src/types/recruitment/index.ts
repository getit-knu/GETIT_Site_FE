import type { components } from "../../apis/generated";

/**
 * 지원 시스템 설정 타입. API 명세서 6.1 ~ 6.11.
 *
 * BE 에 admin recruitment 컨트롤러가 아직 없다. 스키마가 생기면 `generated.ts` 에서 가져온다.
 * (공개 모집 상태 조회는 이미 스키마가 있어 아래 `RecruitmentStatus` 부터 재노출한다.)
 */

/** 6.1 모집 일정. `interviewEndAt` 은 서버가 `totalEndAt` 으로 맞춘다. */
export interface RecruitmentSchedule {
  generationId: number;
  generationNo: number;
  year: number;
  totalStartAt: string;
  totalEndAt: string;
  documentStartAt: string;
  documentEndAt: string;
  interviewStartAt: string;
  interviewEndAt: string;
}

/** 6.2 저장 요청. `interviewEndAt` 은 보내지 않는다. */
export type SchedulePayload = Omit<RecruitmentSchedule, "generationId" | "generationNo" | "year" | "interviewEndAt">;

export type QuestionType = "TEXT" | "CHOICE" | "CHECKBOX";

export interface QuestionOption {
  id: string;
  label: string;
}

/** 6.3 지원서 문항. */
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

export type QuestionPayload = Omit<RecruitmentQuestion, "id" | "order">;

/** 6.8 평가 기준. */
export interface Criterion {
  id: number;
  order: number;
  name: string;
  guideline: string;
  maxScore: number;
}

/** `valid` 는 `totalScore === 100` 여부. 화면의 "총점: 100점" 표시에 쓴다. */
export interface CriteriaBoard {
  criteria: Criterion[];
  totalScore: number;
  valid: boolean;
}

/** 일괄 저장에 보내는 한 줄. 새로 만든 것은 `id` 가 없다. */
export interface CriterionDraft {
  id?: number;
  name: string;
  guideline: string;
  maxScore: number;
}

export type RecruitmentPhase = NonNullable<components["schemas"]["RecruitmentStatusResult"]["phase"]>;

export type ScheduleWindow = Required<components["schemas"]["ScheduleWindow"]>;

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
