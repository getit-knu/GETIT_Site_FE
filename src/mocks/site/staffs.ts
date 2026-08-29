import type { FeatureToggle, Staff } from "../../types/site";

/**
 * 운영진 스냅샷 · 기능 토글 목.
 *
 * 운영진 CRUD 는 실제 BE 엔드포인트로 옮겨갔다(#194) — 이 배열은 이제 공개 사이트
 * (`LeadersPage`)가 쓰는 `getStaffsSnapshot()` 의 시드 데이터로만 남는다. 공개 사이트가
 * 실제 `GET /api/public/staffs` 로 옮겨가면(#187) 이 파일 전체를 지운다.
 *
 * 기능 토글은 아직 실제 엔드포인트가 없어 목으로 남긴다.
 */

const staffs: Staff[] = [
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

const delay = () => new Promise((r) => setTimeout(r, 200));

/**
 * 공개 사이트(운영진 소개 페이지)용 동기 스냅샷.
 *
 * 로딩 상태 없이 바로 쓰는 Home·프로젝트 쇼케이스와 같은 방식으로 이 데이터만 동기로
 * 노출한다. 구역 안에서 order 순으로 정렬한다(서버가 정렬해 주는 것과 같은 기준).
 */
export function getStaffsSnapshot(): Staff[] {
  return structuredClone([...staffs].sort((a, b) => a.section.localeCompare(b.section) || a.order - b.order));
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
