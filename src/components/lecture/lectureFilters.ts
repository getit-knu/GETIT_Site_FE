import type { MemberLectureListParams, MemberTrack } from "../../types/lecture";

export const ALL_LECTURES_FILTER = "ALL";

export interface LectureFilterOption {
  key: string;
  label: string;
  trackId: number;
  subCategoryId: number | null;
}

/**
 * 소분류가 있는 트랙은 소분류별로, 없는 트랙(창업 빌드업 · 세미나)은 트랙 자체로 탭을 만든다.
 * `GET /api/member/tracks`(#150·#193)가 소분류·발행 강의 유무와 무관하게 전체 트랙을 주므로
 * 이걸 그대로 재료로 쓴다 — 강의 목록 응답의 `tabs`(소분류 기준이라 일부 트랙이 빠짐)는 안 쓴다.
 */
export function buildLectureFilterOptions(tracks: MemberTrack[]): LectureFilterOption[] {
  return tracks.flatMap((track): LectureFilterOption[] =>
    track.subCategories.length > 0
      ? track.subCategories.map((sub) => ({
          key: `sub-${sub.id}`,
          label: sub.name,
          trackId: track.id,
          subCategoryId: sub.id,
        }))
      : [{ key: `track-${track.id}`, label: track.name, trackId: track.id, subCategoryId: null }],
  );
}

/** 선택한 탭을 서버 쿼리 파라미터로 바꾼다. "전체"는 둘 다 생략한다. */
export function filterToParams(value: string, tracks: MemberTrack[]): MemberLectureListParams {
  if (value === ALL_LECTURES_FILTER) return {};

  const option = buildLectureFilterOptions(tracks).find((o) => o.key === value);
  if (!option) return {};

  return option.subCategoryId !== null
    ? { trackId: option.trackId, subCategoryId: option.subCategoryId }
    : { trackId: option.trackId };
}
