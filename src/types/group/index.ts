import type { Role } from "../auth";

/**
 * 조 관리 타입. API 명세서 9.6 ~ 9.11.
 *
 * BE 에 admin group 컨트롤러가 아직 없다. 스키마가 생기면 `generated.ts` 에서 가져온다.
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
 * 9.6 응답. 페이지네이션이 아니라 한 덩어리로 온다.
 *
 * **`unassigned` 가 함께 온다.** 조원을 옮길 때 목록 두 개를 따로 조회하지 않아도 된다.
 */
export interface GroupBoard {
  generationNo: number;
  groups: Group[];
  unassigned: GroupMember[];
}
