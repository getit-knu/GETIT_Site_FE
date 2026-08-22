import type { Role } from "../auth";
import type { Page } from "../qna";

/**
 * 어드민 사용자·그룹 타입. API 명세서 9.1 ~ 9.11.
 *
 * BE 에 admin user 컨트롤러가 아직 없다. 스키마가 생기면 `generated.ts` 에서 가져온다.
 */
export type { Page };

export type UserStatus = "ACTIVE" | "WITHDRAWN";

/** 9.1 목록 행. */
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  college: string;
  major: string;
  studentYear: number;
  role: Role;
  /** 서버가 내려주는 한글 표기. FE 에 매핑 테이블을 두지 않는다. */
  roleLabel: string;
  generationNo: number;
  /** 조가 배정되지 않았으면 `null`. */
  group: { id: number; name: string } | null;
  status: UserStatus;
}

export interface UserListParams {
  role?: Role;
  keyword?: string;
  page?: number;
  size?: number;
}

/**
 * 9.2 권한 · 그룹 변경.
 *
 * TODO: 요청 본문 형태가 명세서에만 있고 BE 구현이 없다. 연동 전에 확인한다.
 */
export interface UpdateUserPayload {
  role?: Role;
  /** `null` 이면 조에서 뺀다. */
  groupId?: number | null;
}
