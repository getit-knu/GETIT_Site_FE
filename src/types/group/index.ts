import type { components } from "../../apis/generated";

/**
 * 조 관리 타입. **`generated.ts`에서 재노출한다**(`types/user/index.ts` 상단 주석 참고 —
 * 이 도메인도 스키마 이름 충돌 버그의 영향을 받은 적이 없었다).
 *
 * BE 확인: 조원 소속은 `Group` 엔티티가 아니라 `User.groupId`(단순 FK) 로 표현된다 —
 * 별도 매핑 테이블이 없다.
 */
export type GroupMember = Required<components["schemas"]["GroupMemberResult"]>;

/** `members`는 `Required<>`가 최상위만 채워서(원소는 여전히 optional) 이미 다잡은 `GroupMember`로 손 조립한다. */
export interface Group {
  id: number;
  name: string;
  memberCount: number;
  members: GroupMember[];
}

/**
 * `GET /api/admin/groups` 응답. 페이지네이션이 아니라 한 덩어리로 온다.
 *
 * **`unassigned` 가 함께 온다.** 조원을 옮길 때 목록 두 개를 따로 조회하지 않아도 된다.
 * 활동 중(`ACTIVE`)인 부원만 실린다 — 탈퇴한 사람은 조·미배정 어느 쪽에도 안 보인다.
 */
export interface GroupBoard {
  generationNo: number;
  groups: Group[];
  unassigned: GroupMember[];
}
