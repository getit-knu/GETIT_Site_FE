import type { FeatureToggle, Staff, StaffPayload, StaffSection } from "../../types/site";

/**
 * 운영진 프로필 · 기능 토글 목 (명세서 10.21 ~ 10.24).
 *
 * BE 에 admin setting 컨트롤러가 아직 없어 화면을 먼저 만든다.
 * 앞의 섹션들과 달리 **개별 엔드포인트로 즉시 반영**된다.
 */

let staffs: Staff[] = [
  {
    id: 1,
    userId: 3,
    name: "홍길동",
    staffRole: "회장",
    section: "EXECUTIVE",
    department: "컴퓨터공학과 21",
    introduction: "동아리를 이끌고 있습니다.",
    profileImageUrl: "https://cdn.getit.com/staff/1.png",
    order: 1,
    generationNo: 9,
  },
  {
    id: 2,
    userId: null,
    name: "김운영",
    staffRole: "총무",
    section: "EXECUTIVE",
    department: "경영학과 22",
    introduction: "회계를 맡고 있습니다.",
    profileImageUrl: null,
    order: 3,
    generationNo: 9,
  },
  {
    id: 5,
    userId: null,
    name: "이서준",
    staffRole: "부회장",
    section: "EXECUTIVE",
    department: "컴퓨터공학과 20",
    introduction: "회장을 보좌하고 있습니다.",
    profileImageUrl: null,
    order: 2,
    generationNo: 9,
  },
  {
    id: 3,
    userId: 7,
    name: "이재민",
    staffRole: "SW 운영진",
    section: "SW",
    department: "컴퓨터공학과 21",
    introduction: "프론트엔드를 담당하고 있습니다.",
    profileImageUrl: null,
    order: 1,
    generationNo: 9,
  },
  {
    id: 4,
    userId: null,
    name: "박서연",
    staffRole: "SW 운영진",
    section: "SW",
    department: "전자공학과 22",
    introduction: "백엔드를 담당하고 있습니다.",
    profileImageUrl: null,
    order: 2,
    generationNo: 9,
  },
  {
    id: 6,
    userId: null,
    name: "최민준",
    staffRole: "SW 운영진",
    section: "SW",
    department: "소프트웨어학과 22",
    introduction: "AI·데이터 파트를 담당하고 있습니다.",
    profileImageUrl: null,
    order: 3,
    generationNo: 9,
  },
  {
    id: 7,
    userId: null,
    name: "정하은",
    staffRole: "SW 운영진",
    section: "SW",
    department: "컴퓨터공학과 23",
    introduction: "인프라·배포를 담당하고 있습니다.",
    profileImageUrl: null,
    order: 4,
    generationNo: 9,
  },
  {
    id: 8,
    userId: null,
    name: "오지훈",
    staffRole: "창업 운영진",
    section: "STARTUP",
    department: "경영학과 21",
    introduction: "사업 기획을 담당하고 있습니다.",
    profileImageUrl: null,
    order: 1,
    generationNo: 9,
  },
  {
    id: 9,
    userId: null,
    name: "윤서아",
    staffRole: "창업 운영진",
    section: "STARTUP",
    department: "산업공학과 22",
    introduction: "마케팅을 담당하고 있습니다.",
    profileImageUrl: null,
    order: 2,
    generationNo: 9,
  },
];

let features: FeatureToggle[] = [
  {
    key: "STOCK_GAME",
    label: "주식 게임",
    enabled: false,
    updatedAt: "2026-07-01T10:00:00+09:00",
    updatedBy: "김운영",
  },
  {
    key: "MOCK_INVESTMENT",
    label: "모의 투자",
    enabled: true,
    updatedAt: "2026-07-20T14:30:00+09:00",
    updatedBy: "김운영",
  },
];

let nextStaffId = 10;
const delay = () => new Promise((r) => setTimeout(r, 200));

/** 구역 안에서 order 순으로. 서버가 정렬해 준다. */
function sorted(): Staff[] {
  return [...staffs].sort((a, b) => a.section.localeCompare(b.section) || a.order - b.order);
}

export async function fetchStaffs(): Promise<Staff[]> {
  await delay();
  return structuredClone(sorted());
}

/**
 * 공개 사이트(운영진 소개 페이지)용 동기 스냅샷.
 *
 * `fetchStaffs()`(→ `getStaffs()`, 관리자 전용 `GET /api/admin/setting/staffs`)를 공개
 * 페이지가 그대로 타면, 실제 API가 붙었을 때 로그인 없이 관리자 엔드포인트를 호출하는
 * 모양이 된다. 공개 사이트 전용 API가 따로 생기기 전까지, 로딩 상태 없이 바로 쓰는
 * Home·프로젝트 쇼케이스와 같은 방식으로 이 데이터만 동기로 노출한다.
 */
export function getStaffsSnapshot(): Staff[] {
  return structuredClone(sorted());
}

export async function createStaff(payload: StaffPayload): Promise<Staff> {
  await delay();
  if (payload.name.trim() === "") throw { code: "INVALID_INPUT", message: "이름을 입력해 주세요." };

  const inSection = staffs.filter((s) => s.section === payload.section);
  const staff: Staff = {
    id: nextStaffId++,
    userId: payload.userId,
    name: payload.name,
    staffRole: payload.staffRole,
    section: payload.section,
    department: payload.department,
    introduction: payload.introduction,
    profileImageUrl: null,
    order: inSection.length + 1,
    generationNo: payload.generationNo,
  };
  staffs.push(staff);
  return structuredClone(staff);
}

export async function updateStaff(id: number, payload: StaffPayload): Promise<Staff> {
  await delay();
  const found = staffs.find((s) => s.id === id);
  if (found === undefined) throw { code: "STAFF_NOT_FOUND", message: "운영진을 찾을 수 없습니다." };

  // 구역이 바뀌면 새 구역 끝으로 간다. 옛 구역의 순서 자리를 들고 갈 수 없다.
  if (found.section !== payload.section) {
    found.order = staffs.filter((s) => s.section === payload.section).length + 1;
  }

  Object.assign(found, {
    userId: payload.userId,
    name: payload.name,
    staffRole: payload.staffRole,
    section: payload.section,
    department: payload.department,
    introduction: payload.introduction,
  });
  return structuredClone(found);
}

export async function deleteStaff(id: number): Promise<void> {
  await delay();
  staffs = staffs.filter((s) => s.id !== id);
}

/** 10.22. `section` 안에서만 순서를 다시 매긴다. */
export async function reorderStaffs(section: StaffSection, orderedIds: number[]): Promise<void> {
  await delay();
  orderedIds.forEach((id, at) => {
    const found = staffs.find((s) => s.id === id && s.section === section);
    if (found !== undefined) found.order = at + 1;
  });
}

export async function fetchFeatures(): Promise<FeatureToggle[]> {
  await delay();
  return structuredClone(features);
}

export async function toggleFeature(key: string, enabled: boolean): Promise<FeatureToggle> {
  await delay();
  const found = features.find((f) => f.key === key);
  if (found === undefined) throw { code: "FEATURE_NOT_FOUND", message: "기능을 찾을 수 없습니다." };

  features = features.map((f) =>
    f.key === key ? { ...f, enabled, updatedAt: new Date().toISOString(), updatedBy: "김운영" } : f,
  );
  return structuredClone(features.find((f) => f.key === key) as FeatureToggle);
}
