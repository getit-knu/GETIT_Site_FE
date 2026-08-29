import type { Role } from "../../types/auth";
import type { GroupBoard, GroupMember } from "../../types/group";

/**
 * 조 편성 목.
 *
 * 조 관리 CRUD 는 실제 BE 엔드포인트로 옮겨갔다(#196) — 이 배열은 이제
 * `mocks/lecture/submissions.ts`(제출 현황 목, 조 필터가 이 배정을 그대로 따른다)가
 * 참조하는 고정 시드 데이터로만 남는다. 그 목이 실제 연동으로 바뀌면 이 파일도 지운다.
 */
const ROLE_LABEL: Record<Role, string> = { GUEST: "비회원", MEMBER: "부원", ADMIN: "운영진" };
const NAMES = ["김부원", "이회원", "박학생", "최지원", "정다은", "강민호", "윤서연", "임하늘"];
const MAJORS = ["경영학과", "컴퓨터학부", "전자공학부", "경제통상학부"];

function member(i: number): GroupMember {
  const role: Role = i % 5 === 0 ? "ADMIN" : "MEMBER";
  return {
    userId: 21 + i,
    name: NAMES[i % NAMES.length],
    major: MAJORS[i % MAJORS.length],
    role,
    roleLabel: ROLE_LABEL[role],
  };
}

const board: GroupBoard = {
  generationNo: 9,
  groups: [
    { id: 1, name: "1조", memberCount: 3, members: [member(0), member(1), member(2)] },
    { id: 2, name: "2조", memberCount: 2, members: [member(3), member(4)] },
  ],
  unassigned: [member(5), member(6), member(7)],
};

const delay = () => new Promise((r) => setTimeout(r, 200));

export async function fetchGroups(): Promise<GroupBoard> {
  await delay();
  // 화면이 목 배열을 직접 고치지 못하도록 복사해 넘긴다.
  return structuredClone(board);
}
