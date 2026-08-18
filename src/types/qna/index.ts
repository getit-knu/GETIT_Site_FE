/**
 * Q&A 도메인 타입. API 명세서 11.1 ~ 11.4 를 그대로 옮겼다.
 *
 * BE 의 qna 도메인은 아직 골격만 있다(`package-info.java` 뿐).
 * OpenAPI 스키마가 생기면 `apis/generated.ts` 에서 가져와 재노출한다.
 */
import type { Role } from "../auth";

export type QuestionStatus = "PENDING" | "ANSWERED";

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

/** 목록 행 (11.1). */
export interface QuestionListItem {
  /** 화면 순번. 페이지 기준 연속 번호로 **서버가 계산해 내려준다.** */
  no: number;
  id: number;
  authorName: string;
  major: string;
  content: string;
  createdAt: string;
  status: QuestionStatus;
  /** 서버가 내려주는 한글 표기. FE 에 매핑 테이블을 두지 않기 위함이다. */
  statusLabel: string;
  /** 강의 Q&A 가 아니면 `null`. */
  lectureTitle: string | null;
}

export interface QuestionAuthor {
  id: number;
  name: string;
  college: string;
  major: string;
  role: Role;
}

export interface QuestionAnswer {
  id: number;
  adminId: number;
  adminName: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
}

/** 상세 (11.2). */
export interface QuestionDetail {
  id: number;
  author: QuestionAuthor;
  createdAt: string;
  content: string;
  status: QuestionStatus;
  lecture: { id: number; title: string } | null;
  /** 아직 답변하지 않았으면 `null`. */
  answer: QuestionAnswer | null;
}

/** 목록 조회 조건 (11.1 Query Parameters). */
export interface QuestionListParams {
  status?: QuestionStatus;
  keyword?: string;
  page?: number;
  size?: number;
}
