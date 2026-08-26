import type { LectureFile } from "../../types/lecture";

import { getMemberLecturesSnapshot, type MemberLecture } from "./memberLectures";

export interface MemberLectureDetail extends MemberLecture {
  instructorName: string;
  /** `YYYY-MM-DD`. */
  postedDate: string;
  description: string;
  youtubeUrl: string;
  materials: LectureFile[];
}

type DetailExtra = Omit<MemberLectureDetail, keyof MemberLecture>;

const DEFAULT_EXTRA: DetailExtra = {
  instructorName: "GETIT 운영진",
  postedDate: "2026-06-01",
  description: "학습 목표와 진행 방식을 안내합니다.",
  youtubeUrl: "https://youtube.com/watch?v=abc123",
  materials: [],
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
  },
};

export function getMemberLectureDetail(id: number): MemberLectureDetail | undefined {
  const lecture = getMemberLecturesSnapshot().find((l) => l.id === id);
  if (!lecture) return undefined;

  return { ...lecture, ...(DETAIL_EXTRAS[id] ?? DEFAULT_EXTRA) };
}
