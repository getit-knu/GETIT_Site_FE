import type { Lecture, LectureBoard, LectureListParams, Track } from "../../types/lecture";

/** BE 에 admin lecture 컨트롤러가 아직 없어 화면을 먼저 만든다. */
const TRACKS: Track[] = [
  {
    id: 1,
    name: "SW",
    subCategories: [
      { id: 1, name: "WEB 기초" },
      { id: 2, name: "Express.js" },
      { id: 3, name: "React.js" },
    ],
  },
  // 소분류가 비어 있는 트랙이 있다. 화면이 이 경우를 견뎌야 한다.
  { id: 2, name: "창업 빌드업", subCategories: [] },
  { id: 3, name: "세미나", subCategories: [] },
];

interface StoredLecture extends Lecture {
  trackId: number;
  subCategoryId: number | null;
}

const ALL: StoredLecture[] = [
  {
    id: 101,
    trackId: 1,
    subCategoryId: 1,
    week: 1,
    title: "HTML/CSS 기초",
    description: "웹 개발의 시작, HTML과 CSS 기본 문법",
    deadline: "2026-06-05",
    submittedCount: 45,
    totalCount: 48,
    feedbackDoneCount: 22,
    isPublished: true,
  },
  {
    id: 102,
    trackId: 1,
    subCategoryId: 2,
    week: 2,
    title: "Express 라우팅",
    description: "미들웨어와 라우터 구조",
    deadline: "2026-06-12",
    submittedCount: 42,
    totalCount: 48,
    feedbackDoneCount: 40,
    isPublished: true,
  },
  {
    id: 103,
    trackId: 1,
    subCategoryId: 3,
    week: 3,
    title: "React 상태 관리",
    description: "useState 와 전역 상태",
    deadline: "2026-06-19",
    submittedCount: 38,
    totalCount: 48,
    feedbackDoneCount: 0,
    isPublished: false,
  },
  {
    id: 210,
    trackId: 2,
    subCategoryId: null,
    week: 4,
    title: "창업 빌드업 4차시",
    description: "아이디어 검증과 린 캔버스",
    deadline: "2026-09-01",
    submittedCount: 12,
    totalCount: 48,
    feedbackDoneCount: 5,
    isPublished: true,
  },
  {
    id: 310,
    trackId: 3,
    subCategoryId: null,
    week: 1,
    title: "금융 IT 세미나",
    description: "현직자 초청 세미나",
    deadline: "2026-07-01",
    submittedCount: 30,
    totalCount: 48,
    feedbackDoneCount: 30,
    isPublished: true,
  },
];

const delay = () => new Promise((r) => setTimeout(r, 200));

/** trackId · subCategoryId 는 서버 내부 값이다. 응답(8.1)에는 들어가지 않는다. */
function toLecture(stored: StoredLecture): Lecture {
  const { trackId, subCategoryId, ...lecture } = stored;
  void trackId;
  void subCategoryId;
  return lecture;
}

export async function fetchLectures(params: LectureListParams): Promise<LectureBoard> {
  await delay();
  const { trackId, subCategoryId } = params;

  const lectures = ALL.filter((l) => {
    if (trackId !== undefined && l.trackId !== trackId) return false;
    if (subCategoryId !== undefined && l.subCategoryId !== subCategoryId) return false;
    return true;
  }).map(toLecture);

  return { tracks: structuredClone(TRACKS), lectures };
}

export async function deleteLecture(id: number): Promise<void> {
  await delay();
  const at = ALL.findIndex((l) => l.id === id);
  if (at >= 0) ALL.splice(at, 1);
}
