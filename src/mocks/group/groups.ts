import type { Role } from "../../types/auth";
import type { GroupBoard, GroupMember } from "../../types/group";

/** BE 에 admin group 컨트롤러가 아직 없어 화면을 먼저 만든다. */
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

/** 서버가 들고 있는 상태를 흉내 낸다. 조원을 옮기면 양쪽이 함께 바뀌어야 한다. */
const board: GroupBoard = {
  generationNo: 9,
  groups: [
    { id: 1, name: "1조", memberCount: 3, members: [member(0), member(1), member(2)] },
    { id: 2, name: "2조", memberCount: 2, members: [member(3), member(4)] },
  ],
  unassigned: [member(5), member(6), member(7)],
};

let nextGroupId = 3;
const delay = () => new Promise((r) => setTimeout(r, 200));

function syncCounts() {
  board.groups.forEach((g) => (g.memberCount = g.members.length));
}

export async function fetchGroups(): Promise<GroupBoard> {
  await delay();
  // 화면이 목 배열을 직접 고치지 못하도록 복사해 넘긴다.
  return structuredClone(board);
}

export async function createGroup(name: string): Promise<void> {
  await delay();
  board.groups.push({ id: nextGroupId++, name, memberCount: 0, members: [] });
}

export async function renameGroup(id: number, name: string): Promise<void> {
  await delay();
  const group = board.groups.find((g) => g.id === id);
  if (group) group.name = name;
}

/** 조를 지우면 그 조원은 미배정으로 돌아간다. 사람이 사라지면 안 된다. */
export async function deleteGroup(id: number): Promise<void> {
  await delay();
  const at = board.groups.findIndex((g) => g.id === id);
  if (at < 0) return;

  board.unassigned.push(...board.groups[at].members);
  board.groups.splice(at, 1);
}

export async function addMember(groupId: number, userId: number): Promise<void> {
  await delay();
  const group = board.groups.find((g) => g.id === groupId);
  const at = board.unassigned.findIndex((m) => m.userId === userId);
  if (!group || at < 0) return;

  group.members.push(board.unassigned[at]);
  board.unassigned.splice(at, 1);
  syncCounts();
}

export async function removeMember(groupId: number, userId: number): Promise<void> {
  await delay();
  const group = board.groups.find((g) => g.id === groupId);
  const at = group?.members.findIndex((m) => m.userId === userId) ?? -1;
  if (!group || at < 0) return;

  board.unassigned.push(group.members[at]);
  group.members.splice(at, 1);
  syncCounts();
}
