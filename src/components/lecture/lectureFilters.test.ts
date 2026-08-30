import { describe, expect, it } from "vitest";

import type { MemberTrack } from "../../types/lecture";

import { ALL_LECTURES_FILTER, buildLectureFilterOptions, filterToParams } from "./lectureFilters";

const TRACKS: MemberTrack[] = [
  {
    id: 1,
    name: "SW",
    subCategories: [
      { id: 1, name: "WEB 기초" },
      { id: 2, name: "백엔드" },
    ],
  },
  { id: 2, name: "창업 빌드업", subCategories: [] },
];

describe("buildLectureFilterOptions", () => {
  it("소분류가 있는 트랙은 소분류별로 탭을 만든다", () => {
    const options = buildLectureFilterOptions(TRACKS);

    expect(options).toContainEqual({ key: "sub-1", label: "WEB 기초", trackId: 1, subCategoryId: 1 });
    expect(options).toContainEqual({ key: "sub-2", label: "백엔드", trackId: 1, subCategoryId: 2 });
  });

  it("소분류가 없는 트랙은 트랙 자체로 탭 하나를 만든다", () => {
    const options = buildLectureFilterOptions(TRACKS);

    expect(options).toContainEqual({ key: "track-2", label: "창업 빌드업", trackId: 2, subCategoryId: null });
  });
});

describe("filterToParams", () => {
  it("ALL이면 파라미터를 아무것도 안 보낸다", () => {
    expect(filterToParams(ALL_LECTURES_FILTER, TRACKS)).toEqual({});
  });

  it("소분류 키는 trackId·subCategoryId를 함께 보낸다", () => {
    expect(filterToParams("sub-2", TRACKS)).toEqual({ trackId: 1, subCategoryId: 2 });
  });

  it("소분류 없는 트랙 키는 trackId만 보낸다", () => {
    expect(filterToParams("track-2", TRACKS)).toEqual({ trackId: 2 });
  });
});
