import type { components } from "../../apis/generated";
import type { Role } from "../auth";
import type { Page } from "../qna";

/**
 * 어드민 사용자 타입. **`generated.ts`에서 재노출한다.**
 *
 * User·Group 은 같은 BE 패키지(`domain.user`)에서 나오지만 화면(탭)이 갈려 파일은 나눈다
 * (Group 쪽은 `types/group/index.ts`). `domain/user/dto/*` DTO는 도메인 접두어가 붙은
 * 고유한 이름(`UserSummary`, `UserUpdateRequest` 등)이라 스키마 이름 충돌 버그
 * (`getit-knu/GETIT_Site_BE#137`, `types/lecture/index.ts` 상단 주석 참고)의 영향을
 * 받은 적이 없었다 — #138 이후 다시 확인해 보니 애초에 손타입이 필요 없었다.
 */
export type { Page };

export type UserStatus = NonNullable<components["schemas"]["UserSummary"]["status"]>;

/**
 * 목록 행. `college`·`major`·`studentYear`·`generationNo`·`group`은 생성된 스키마에
 * `| null`이 안 잡혀 있다(springdoc 함정) — `GUEST`(아직 기수 없음)·조 미배정 등
 * 실제로 `null`이 오는 경우가 있어 손으로 되돌린다.
 */
export type AdminUser = Omit<
  Required<components["schemas"]["UserSummary"]>,
  "college" | "major" | "studentYear" | "generationNo" | "group"
> & {
  college: string | null;
  major: string | null;
  studentYear: number | null;
  /** GUEST 는 아직 기수가 없어 `null`. */
  generationNo: number | null;
  /** 조가 배정되지 않았으면 `null`. */
  group: Required<components["schemas"]["GroupSummary"]> | null;
};

export interface UserListParams {
  role?: Role;
  keyword?: string;
  /** `"none"` 은 미배정만, 숫자는 그 조만. 비우면 전체. */
  groupId?: number | "none";
  generationNo?: number;
  page?: number;
  size?: number;
}

/**
 * `PUT /api/admin/users/{id}` 요청 본문. 셋 다 선택 — 보낸 필드만 바뀐다.
 *
 * `groupId`는 스키마엔 optional 숫자뿐이지만, "조에서 뺀다"는 뜻으로 명시적 `null`을
 * 보낼 수 있어야 해서 손으로 되돌린다.
 */
export type UpdateUserPayload = Omit<components["schemas"]["UserUpdateRequest"], "groupId"> & {
  /** `null` 이면 조에서 뺀다. */
  groupId?: number | null;
};

/** 서류 합격자를 한 번에 승격한 결과. */
export type PromotionSkipReason = NonNullable<components["schemas"]["PromotionSkipResult"]["reason"]>;

export interface PromotionResult {
  promotedCount: number;
  skippedCount: number;
  skipped: { applicationId: number; reason: PromotionSkipReason }[];
}
