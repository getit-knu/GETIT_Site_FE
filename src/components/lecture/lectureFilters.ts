import type { MemberLecture } from "../../mocks/lecture/memberLectures";
import { TRACKS } from "../../mocks/lecture/lectures";

export const ALL_LECTURES_FILTER = "ALL";

export interface LectureFilterOption {
  key: string;
  label: string;
  matches: (lecture: MemberLecture) => boolean;
}

/**
 * 소분류가 있는 트랙은 소분류별로, 없는 트랙(창업 빌드업 · 세미나)은 트랙 자체로 탭을 만든다.
 * Figma도 이렇게 트랙과 소분류를 한 줄에 평평하게 나열한다.
 */
export function buildLectureFilterOptions(): LectureFilterOption[] {
  return TRACKS.flatMap((track) =>
    track.subCategories.length > 0
      ? track.subCategories.map((sub) => ({
          key: `sub-${sub.id}`,
          label: sub.name,
          matches: (lecture: MemberLecture) => lecture.subCategoryId === sub.id,
        }))
      : [
          {
            key: `track-${track.id}`,
            label: track.name,
            matches: (lecture: MemberLecture) => lecture.trackId === track.id && lecture.subCategoryId === null,
          },
        ],
  );
}

/** 페이지가 필터 값에 맞는 강의만 골라낼 때 쓴다. 탭의 매칭 규칙과 다르게 굴면 안 되니 여기서 함께 관리한다. */
export function filterLectures(lectures: MemberLecture[], value: string): MemberLecture[] {
  if (value === ALL_LECTURES_FILTER) return lectures;

  const option = buildLectureFilterOptions().find((o) => o.key === value);
  return option ? lectures.filter(option.matches) : lectures;
}
