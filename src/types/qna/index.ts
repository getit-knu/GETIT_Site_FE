import type { components } from "../../apis/generated";

/** Q&A 도메인 타입. `apis/generated.ts`에서 재노출한다(#216). */

export type QuestionStatus = NonNullable<components["schemas"]["AdminQuestionResultListRow"]["status"]>;

/** 페이지네이션 응답 (명세서 0.3). `page` 는 0부터. */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * 목록 행 (11.1). `lectureTitle`은 강의 Q&A 가 아니면 실제로 `null`이 온다(BE 확인함,
 * springdoc이 이 nullable을 못 잡음) — 손으로 되돌린다.
 */
export type QuestionListItem = Omit<Required<components["schemas"]["AdminQuestionResultListRow"]>, "lectureTitle"> & {
  lectureTitle: string | null;
};

/**
 * `college`·`major`는 GUEST(아직 정보 미입력)면 `null`이 온다(BE 확인함) — 손으로 되돌린다.
 */
export type QuestionAuthor = Omit<Required<components["schemas"]["AdminQuestionResultAuthor"]>, "college" | "major"> & {
  college: string | null;
  major: string | null;
};

/** `updatedAt`은 수정한 적 없으면 `null`이 온다(BE 확인함) — 손으로 되돌린다. */
export type QuestionAnswer = Omit<Required<components["schemas"]["AdminQuestionResultAnswerView"]>, "updatedAt"> & {
  updatedAt: string | null;
};

/** 상세 (11.2). `lecture`·`answer`는 없으면 `null`이 온다(BE 확인함) — 손으로 되돌린다. */
export type QuestionDetail = Omit<
  Required<components["schemas"]["AdminQuestionResultDetail"]>,
  "lecture" | "answer"
> & {
  lecture: { id: number; title: string } | null;
  answer: QuestionAnswer | null;
};

export type AnswerPayload = components["schemas"]["AdminAnswerRequestWrite"];

/** `POST /{id}/answer` 응답 (11.3). */
export type AnswerCreateResult = Required<components["schemas"]["AdminAnswerResultCreateResult"]>;

/** `PUT /{id}/answer` 응답 (11.4). */
export type AnswerUpdateResult = Required<components["schemas"]["AdminAnswerResultUpdateResult"]>;

/**
 * 목록 조회 조건 (11.1 Query Parameters).
 *
 * `lectureId`는 문자열 쿼리로 나간다 — 숫자면 그 강의로 필터링하고, 문자열
 * `"none"`을 그대로 보내면 "강의에 안 딸린 사이트 Q&A만"이라는 뜻이다(BE 소스로
 * 확인함, `QuestionAdminController`가 `"none"`을 별도 상수로 다룸). 생략하면 전체.
 */
export interface QuestionListParams {
  status?: QuestionStatus;
  lectureId?: number | "none";
  keyword?: string;
  page?: number;
  size?: number;
}
