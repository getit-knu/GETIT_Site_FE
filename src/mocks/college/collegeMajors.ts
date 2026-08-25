import type { College, Major } from "../../types/college";

/**
 * BE 마이그레이션(`V8__create_college_major_schema.sql`) 시드 데이터 기준.
 *
 * 경영대학의 전공 2개(경영학과 · 경영정보학과)는 BE 시드 그대로다. 공과대학 · IT융합대학은
 * BE에 college만 시드돼 있고 전공은 아직 없다("실제 전체 목록은 별도로 받아서 채워야 한다"는
 * 주석이 있음) — 드롭다운을 테스트해볼 수 있도록 그럴듯한 전공을 몇 개 추가했다. 실제 목록이
 * 정해지면 여기만 교체하면 된다.
 */
export const COLLEGES: College[] = [
  { id: 1, name: "경영대학" },
  { id: 2, name: "공과대학" },
  { id: 3, name: "IT융합대학" },
];

export const MAJORS: Major[] = [
  { id: 1, collegeId: 1, name: "경영학과" },
  { id: 2, collegeId: 1, name: "경영정보학과" },
  { id: 3, collegeId: 2, name: "기계공학과" },
  { id: 4, collegeId: 2, name: "전자공학과" },
  { id: 5, collegeId: 3, name: "소프트웨어학과" },
  { id: 6, collegeId: 3, name: "모바일공학과" },
];

export function getMajorsByCollege(collegeId: number): Major[] {
  return MAJORS.filter((major) => major.collegeId === collegeId);
}
