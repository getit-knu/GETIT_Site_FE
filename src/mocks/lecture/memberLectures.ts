/**
 * 부원 화면(강좌 목록)용 강의 목. `types/lecture`의 `Lecture`(관리자 8.x 스펙)는
 * 제출 카운트 등 관리자 전용 필드만 있고 `durationMinutes`·개인 제출 여부("완료" 배지) 같은
 * 부원 화면에 필요한 값이 없어, 억지로 끼워 맞추지 않고 이 화면 전용으로 따로 둔다.
 * 트랙 · 소분류 분류 체계는 `mocks/lecture/lectures.ts`의 `TRACKS`를 그대로 재사용한다.
 */
export interface MemberLecture {
  id: number;
  trackId: number;
  subCategoryId: number | null;
  week: number;
  title: string;
  durationMinutes: number;
  /** `YYYY-MM-DD`. */
  deadline: string;
  /** 로그인한 부원 본인의 제출 여부. */
  completed: boolean;
}

const MEMBER_LECTURES: MemberLecture[] = [
  {
    id: 1,
    trackId: 1,
    subCategoryId: 1,
    week: 1,
    title: "HTML/CSS 기초",
    durationMinutes: 120,
    deadline: "2026-06-05",
    completed: true,
  },
  {
    id: 2,
    trackId: 1,
    subCategoryId: 1,
    week: 2,
    title: "반응형 레이아웃",
    durationMinutes: 90,
    deadline: "2026-06-12",
    completed: false,
  },
  {
    id: 3,
    trackId: 1,
    subCategoryId: 2,
    week: 3,
    title: "Express 라우팅",
    durationMinutes: 120,
    deadline: "2026-06-19",
    completed: true,
  },
  {
    id: 5,
    trackId: 1,
    subCategoryId: 3,
    week: 5,
    title: "React 컴포넌트 기초",
    durationMinutes: 110,
    deadline: "2026-07-03",
    completed: false,
  },
  {
    id: 7,
    trackId: 2,
    subCategoryId: null,
    week: 1,
    title: "린 캔버스 작성법",
    durationMinutes: 90,
    deadline: "2026-06-15",
    completed: true,
  },
  {
    id: 8,
    trackId: 2,
    subCategoryId: null,
    week: 2,
    title: "MVP 기획",
    durationMinutes: 100,
    deadline: "2026-06-22",
    completed: false,
  },
  {
    id: 9,
    trackId: 3,
    subCategoryId: null,
    week: 1,
    title: "금융 IT 세미나",
    durationMinutes: 60,
    deadline: "2026-07-01",
    completed: true,
  },
];

export function getMemberLecturesSnapshot(): MemberLecture[] {
  return structuredClone(MEMBER_LECTURES);
}
