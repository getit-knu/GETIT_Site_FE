import type { Role } from "../auth";
import type { Page } from "../qna";

/**
 * 어드민 사용자 타입.
 *
 * User·Group 은 같은 BE 패키지(`domain.user`)에서 나오지만 화면(탭)이 갈려 파일은 나눈다.
 * `generated.ts` 를 쓰지 않는다 — 이 BE는 중첩 클래스 이름이 다른 도메인과 겹치면
 * springdoc이 스키마를 잘못 등록하는 버그가 있다(`types/lecture/index.ts` 상단 주석에
 * 실제 확인한 사례가 있다). BE `UserAdminController`/`domain/user/dto/*` 를 직접 읽었다.
 */
export type { Page };

export type UserStatus = "ACTIVE" | "WITHDRAWN";

/** 목록 행. */
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  college: string | null;
  major: string | null;
  studentYear: number | null;
  role: Role;
  /** 서버가 내려주는 한글 표기. FE 에 매핑 테이블을 두지 않는다. */
  roleLabel: string;
  /** GUEST 는 아직 기수가 없어 `null`. */
  generationNo: number | null;
  /** 조가 배정되지 않았으면 `null`. */
  group: { id: number; name: string } | null;
  status: UserStatus;
}

export interface UserListParams {
  role?: Role;
  keyword?: string;
  /** `"none"` 은 미배정만, 숫자는 그 조만. 비우면 전체. */
  groupId?: number | "none";
  generationNo?: number;
  page?: number;
  size?: number;
}

/** `PUT /api/admin/users/{id}` 요청 본문. 셋 다 선택 — 보낸 필드만 바뀐다. */
export interface UpdateUserPayload {
  role?: Role;
  /** `null` 이면 조에서 뺀다. */
  groupId?: number | null;
  generationNo?: number;
}

/** 서류 합격자를 한 번에 승격한 결과. */
export type PromotionSkipReason = "ALREADY_MEMBER" | "USER_WITHDRAWN" | "NOT_FINAL_PASS";

export interface PromotionResult {
  promotedCount: number;
  skippedCount: number;
  skipped: { applicationId: number; reason: PromotionSkipReason }[];
}
