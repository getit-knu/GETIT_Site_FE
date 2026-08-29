import type { Role } from "../auth";

/**
 * 조 관리 타입.
 *
 * BE 확인: 조원 소속은 `Group` 엔티티가 아니라 `User.groupId`(단순 FK) 로 표현된다 —
 * 별도 매핑 테이블이 없다. `generated.ts` 는 안 쓴다(`types/user/index.ts` 상단 주석 참고).
 */
export interface GroupMember {
  userId: number;
  name: string;
  major: string;
  role: Role;
  /** 서버가 내려주는 한글 표기. FE 에 매핑 테이블을 두지 않는다. */
  roleLabel: string;
}

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
