import type { Role } from "../../types/auth";
import type { AdminUser, Page, UpdateUserPayload, UserListParams } from "../../types/user";

/** BE 에 admin user 컨트롤러가 아직 없어 화면을 먼저 만든다. */
const ROLE_LABEL: Record<Role, string> = { GUEST: "비회원", MEMBER: "부원", ADMIN: "운영진" };
const NAMES = ["김부원", "이회원", "박학생", "최지원", "정다은", "강민호", "윤서연"];
const COLLEGES = ["경영대학", "IT융합대학", "공과대학"];
const MAJORS = ["경영학과", "컴퓨터학부", "전자공학부"];
const GROUPS = [null, { id: 1, name: "1조" }, { id: 2, name: "2조" }];

const ALL: AdminUser[] = Array.from({ length: 27 }, (_, i) => {
  const role: Role = i % 7 === 0 ? "GUEST" : i % 11 === 0 ? "ADMIN" : "MEMBER";
  return {
    id: 21 + i,
    name: NAMES[i % NAMES.length],
    email: `member${i + 1}@example.com`,
    college: COLLEGES[i % COLLEGES.length],
    major: MAJORS[i % MAJORS.length],
    studentYear: (i % 4) + 1,
    role,
    roleLabel: ROLE_LABEL[role],
    generationNo: 9,
    group: GROUPS[i % GROUPS.length],
    status: "ACTIVE",
  };
});

const delay = () => new Promise((r) => setTimeout(r, 200));

export async function fetchUsers(params: UserListParams): Promise<Page<AdminUser>> {
  await delay();
  const { role, keyword, page = 0, size = 10 } = params;
  const kw = keyword?.trim().toLowerCase();

  const filtered = ALL.filter((u) => {
    if (role && u.role !== role) return false;
    if (!kw) return true;
    return u.name.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw);
  });

  const start = page * size;
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  return {
    content: filtered.slice(start, start + size),
    page,
    size,
    totalElements: filtered.length,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<void> {
  await delay();
  const user = ALL.find((u) => u.id === id);
  if (!user) throw { code: "USER_NOT_FOUND", message: "사용자를 찾을 수 없습니다." };

  if (payload.role) {
    user.role = payload.role;
    user.roleLabel = ROLE_LABEL[payload.role];
  }
  if (payload.groupId !== undefined) {
    user.group = payload.groupId === null ? null : (GROUPS.find((g) => g?.id === payload.groupId) ?? null);
  }
}

export async function deleteUser(id: number): Promise<void> {
  await delay();
  const at = ALL.findIndex((u) => u.id === id);
  if (at >= 0) ALL.splice(at, 1);
}

/** 활성 기수의 서류 합격자를 한 번에 MEMBER 로 올린다. */
export async function promoteApplicants(): Promise<number> {
  await delay();
  const targets = ALL.filter((u) => u.role === "GUEST");
  targets.forEach((u) => {
    u.role = "MEMBER";
    u.roleLabel = ROLE_LABEL.MEMBER;
  });
  return targets.length;
}
