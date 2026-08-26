import type { Assignment, LectureFile } from "../../types/lecture";

import { getMemberLecturesSnapshot, type MemberLecture } from "./memberLectures";

export interface MemberLectureDetail extends MemberLecture {
  instructorName: string;
  /** `YYYY-MM-DD`. */
  postedDate: string;
  description: string;
  youtubeUrl: string;
  materials: LectureFile[];
  /** 없는 강의는 `null`. `completed`가 이미 본인 제출 여부라 제출 폼과 함께 쓴다. */
  assignment: Assignment | null;
}

type DetailExtra = Omit<MemberLectureDetail, keyof MemberLecture>;

const DEFAULT_EXTRA: DetailExtra = {
  instructorName: "GETIT 운영진",
  postedDate: "2026-06-01",
  description: "학습 목표와 진행 방식을 안내합니다.",
  youtubeUrl: "https://youtube.com/watch?v=abc123",
  materials: [],
  assignment: null,
};

/** id별 상세 mock. 없는 id는 `DEFAULT_EXTRA`로 채운다. */
const DETAIL_EXTRAS: Record<number, DetailExtra> = {
  1: {
    instructorName: "GETIT SW교육 팀장",
    postedDate: "2026-06-01",
    description: "HTML과 CSS의 기본 개념을 이해하고, 웹 페이지의 구조와 스타일을 만들어봅니다.",
    youtubeUrl: "https://youtube.com/watch?v=abc123",
    materials: [
      { fileId: 501, displayName: "강의 자료.pdf", url: "https://cdn.getit.com/501", size: 2048576 },
      { fileId: 502, displayName: "예제 코드.zip", url: "https://cdn.getit.com/502", size: 1048576 },
    ],
    assignment: {
      title: "간단한 자기소개 페이지 만들기",
      description: "HTML과 CSS를 사용하여 자신을 소개하는 웹 페이지를 만들어보세요.",
      deadline: "2026-06-19",
    },
  },
  2: {
    instructorName: "GETIT 운영진",
    postedDate: "2026-06-08",
    description: "미디어 쿼리와 flexbox를 활용해 반응형 레이아웃을 구현합니다.",
    youtubeUrl: "https://youtube.com/watch?v=def456",
    materials: [],
    assignment: {
      title: "반응형 카드 레이아웃 만들기",
      description: "미디어 쿼리를 사용해 화면 크기에 따라 배치가 바뀌는 카드 레이아웃을 만들어보세요.",
      deadline: "2026-06-12",
    },
  },
};

export function getMemberLectureDetail(id: number): MemberLectureDetail | undefined {
  const lecture = getMemberLecturesSnapshot().find((l) => l.id === id);
  if (!lecture) return undefined;

  return { ...lecture, ...(DETAIL_EXTRAS[id] ?? DEFAULT_EXTRA) };
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 200));

/** 실제 업로드 없이 지연만 흉내 낸다. BE 부원용 제출 엔드포인트가 없어 서버에 남지 않는다. */
export async function submitAssignment(lectureId: number, file: File, comment: string): Promise<void> {
  void lectureId;
  void file;
  void comment;
  await delay();
}
